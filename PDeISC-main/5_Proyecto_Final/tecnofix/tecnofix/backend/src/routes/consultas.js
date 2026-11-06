import { Router } from 'express';
import { pool, withTransaction, audit } from '../config/db.js';
import { ah, badRequest, conflict, forbidden, notFound } from '../utils/errors.js';
import { parse, schemas, idParam } from '../utils/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asignarEnConexion, reintentarPendientes } from '../services/assignment.js';
import { SELECT_CONSULTA, consultaAutorizada, TRANSICIONES } from '../services/consultas.js';
import { notifyTechnician, notifyUser } from '../services/push.js';

const router = Router();
router.use(authenticate());
const ESTADO_LABELS = {
  pendiente: 'pendiente',
  asignada: 'asignada a un técnico',
  en_proceso: 'en proceso',
  esperando_cliente: 'esperando tu respuesta',
  finalizada: 'finalizada',
  cancelada: 'cancelada',
};

// Listado según el rol: cada uno ve solo lo suyo (el admin ve todo, con filtro opcional ?estado=)
router.get('/', ah(async (req, res) => {
  const { estado } = req.query;
  const where = []; const params = [];
  if (req.user.rol === 'cliente') { where.push('c.cliente_id = ?'); params.push(req.user.id); }
  else if (req.user.rol === 'tecnico') { where.push('c.tecnico_id = ?'); params.push(req.user.tecnico_id ?? 0); }
  if (estado) {
    if (!['pendiente', 'asignada', 'en_proceso', 'esperando_cliente', 'finalizada', 'cancelada'].includes(estado)) throw badRequest('Estado inválido');
    where.push('c.estado = ?'); params.push(estado);
  }
  const [rows] = await pool.execute(`${SELECT_CONSULTA} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY c.created_at DESC, c.id DESC LIMIT 500`, params);
  res.json({ consultas: rows });
}));

router.post('/', requireRole('cliente'), ah(async (req, res) => {
  const d = parse(schemas.consulta, req.body);
  // Crear + intentar asignar en UNA transacción: o queda todo guardado o nada.
  const id = await withTransaction(async (conn) => {
    const [r] = await conn.execute(
      'INSERT INTO consultas (cliente_id, tipo_equipo, marca, modelo, descripcion) VALUES (?,?,?,?,?)',
      [req.user.id, d.tipo_equipo, d.marca, d.modelo, d.descripcion]);
    await audit(conn, req.user.id, 'consulta.creada', 'consulta', r.insertId);
    await asignarEnConexion(conn, r.insertId, null);
    return r.insertId;
  });
  const consulta = await consultaAutorizada(req.user, id);
  if (consulta.estado === 'asignada') {
    const notification = {
      title: 'Nueva consulta asignada',
      body: `La consulta #${id} fue asignada a un técnico.`,
      data: { type: 'estado', consultaId: id, estado: consulta.estado },
    };
    await Promise.all([
      notifyTechnician(consulta.tecnico_id, {
        ...notification,
        body: `Tenés una nueva consulta asignada (#${id}).`,
      }, 'consulta asignada'),
      notifyUser(consulta.cliente_id, notification, 'consulta asignada'),
    ]);
  }
  res.status(201).json({ consulta });
}));

router.get('/:id', ah(async (req, res) => {
  res.json({ consulta: await consultaAutorizada(req.user, idParam(req.params.id)) });
}));

router.patch('/:id/estado', requireRole('tecnico', 'cliente'), ah(async (req, res) => {
  const id = idParam(req.params.id);
  const { estado: nuevo } = parse(schemas.estado, req.body);
  const consulta = await consultaAutorizada(req.user, id);
  let actual;
  await withTransaction(async (conn) => {
    const [rows] = await conn.execute('SELECT estado FROM consultas WHERE id = ? FOR UPDATE', [id]);
    actual = rows[0].estado;
    const permitidos = TRANSICIONES[req.user.rol]?.[actual] || [];
    if (!permitidos.includes(nuevo)) {
      throw conflict(`No se puede pasar de "${actual}" a "${nuevo}"${permitidos.length ? `. Permitido: ${permitidos.join(', ')}` : ''}`);
    }
    await conn.execute(
      `UPDATE consultas SET estado = ?, finalizada_at = IF(? = 'finalizada', UTC_TIMESTAMP(), finalizada_at) WHERE id = ?`,
      [nuevo, nuevo, id]);
    await audit(conn, req.user.id, 'consulta.estado', 'consulta', id, { de: actual, a: nuevo });
  });
  const notification = {
    title: 'Actualización de la consulta',
    body: `La consulta #${id} pasó a ${ESTADO_LABELS[nuevo]}.`,
    data: { type: 'estado', consultaId: id, estado: nuevo },
  };
  if (req.user.rol === 'tecnico') {
    await notifyUser(consulta.cliente_id, notification, 'estado de consulta');
  } else {
    await notifyTechnician(consulta.tecnico_id, notification, 'estado de consulta');
  }
  // Finalizar/cancelar libera cupo: se intenta asignar las pendientes automáticamente.
  if (['finalizada', 'cancelada'].includes(nuevo)) await reintentarPendientes();
  res.json({ consulta: await consultaAutorizada(req.user, id) });
}));

router.get('/:id/mensajes', ah(async (req, res) => {
  const id = idParam(req.params.id);
  await consultaAutorizada(req.user, id);
  const [rows] = await pool.execute(
    `SELECT m.id, m.consulta_id, m.autor_id, m.contenido, m.created_at, u.nombre AS autor_nombre, u.apellido AS autor_apellido, u.rol AS autor_rol
       FROM mensajes m JOIN usuarios u ON u.id = m.autor_id WHERE m.consulta_id = ? ORDER BY m.id`, [id]);
  res.json({ mensajes: rows });
}));

router.post('/:id/mensajes', requireRole('cliente', 'tecnico'), ah(async (req, res) => {
  const id = idParam(req.params.id);
  const { contenido } = parse(schemas.mensaje, req.body);
  const c = await consultaAutorizada(req.user, id);
  if (['finalizada', 'cancelada'].includes(c.estado)) throw conflict('La consulta está cerrada y no admite más mensajes');
  let estadoActualizado = false;
  await withTransaction(async (conn) => {
    await conn.execute('INSERT INTO mensajes (consulta_id, autor_id, contenido) VALUES (?,?,?)', [id, req.user.id, contenido]);
    // Si el técnico esperaba respuesta del cliente y este responde, vuelve a "en_proceso".
    if (req.user.rol === 'cliente' && c.estado === 'esperando_cliente') {
      const [result] = await conn.execute("UPDATE consultas SET estado='en_proceso' WHERE id=? AND estado='esperando_cliente'", [id]);
      estadoActualizado = result.affectedRows > 0;
    }
  });
  const messageNotification = req.user.rol === 'cliente'
    ? {
      title: 'Nuevo mensaje del cliente',
      body: estadoActualizado
        ? `El cliente respondió y la consulta #${id} volvió a estar en proceso.`
        : `Tenés un nuevo mensaje del cliente en la consulta #${id}.`,
    }
    : {
      title: 'Nuevo mensaje del técnico',
      body: `Tenés un nuevo mensaje del técnico en la consulta #${id}.`,
    };
  const notification = {
    ...messageNotification,
    data: { type: 'mensaje', consultaId: id },
  };
  if (req.user.rol === 'cliente') {
    await notifyTechnician(c.tecnico_id, notification, 'nuevo mensaje');
  } else {
    await notifyUser(c.cliente_id, notification, 'nuevo mensaje');
  }
  res.status(201).json({ ok: true });
}));

router.post('/:id/valoracion', requireRole('cliente'), ah(async (req, res) => {
  const id = idParam(req.params.id);
  const d = parse(schemas.valoracion, req.body);
  const c = await consultaAutorizada(req.user, id);
  if (c.estado !== 'finalizada') throw conflict('Solo se puede calificar una consulta finalizada');
  if (!c.tecnico_id) throw conflict('La consulta no tiene técnico asignado');
  try {
    await pool.execute('INSERT INTO valoraciones (consulta_id, cliente_id, tecnico_id, estrellas, comentario) VALUES (?,?,?,?,?)',
      [id, req.user.id, c.tecnico_id, d.estrellas, d.comentario]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw conflict('Esta consulta ya fue calificada');
    throw e;
  }
  await notifyTechnician(c.tecnico_id, {
    title: 'Recibiste una valoración',
    body: `Tu trabajo en la consulta #${id} recibió ${d.estrellas} ${d.estrellas === 1 ? 'estrella' : 'estrellas'}.`,
    data: { type: 'valoracion', consultaId: id },
  }, 'nueva valoración');
  res.status(201).json({ consulta: await consultaAutorizada(req.user, id) });
}));

export default router;
