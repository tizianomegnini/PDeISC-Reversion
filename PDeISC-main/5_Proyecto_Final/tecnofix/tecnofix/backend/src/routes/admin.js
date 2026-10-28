import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool, withTransaction, audit } from '../config/db.js';
import { env } from '../config/env.js';
import { ah, badRequest, conflict, notFound } from '../utils/errors.js';
import { parse, schemas, idParam } from '../utils/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asignarConsulta, reintentarPendientes, limiteDefault } from '../services/assignment.js';
import { SELECT_CONSULTA } from '../services/consultas.js';
import { listarTecnicosConStats, statsLocales, resumenAdmin } from '../services/stats.js';

const router = Router();
router.use(authenticate(), requireRole('admin'));

const passwordTemporal = () => crypto.randomBytes(9).toString('base64url') + 'a1';

router.get('/resumen', ah(async (_req, res) => res.json({ resumen: await resumenAdmin() })));
router.get('/estadisticas', ah(async (_req, res) => res.json({ tecnicos: await listarTecnicosConStats(), locales: await statsLocales() })));

// ---------- Técnicos ----------
router.get('/tecnicos', ah(async (_req, res) => res.json({ tecnicos: await listarTecnicosConStats() })));

router.post('/tecnicos', ah(async (req, res) => {
  const d = parse(schemas.tecnicoCrear, req.body);
  const [loc] = await pool.execute('SELECT id FROM locales WHERE id=? AND activo=1', [d.local_id]);
  if (!loc[0]) throw badRequest('El local indicado no existe o está inactivo');
  const temporal = d.password ? null : passwordTemporal();
  const hash = await bcrypt.hash(d.password ?? temporal, env.bcryptRounds);
  const limite = d.limite_consultas ?? (await limiteDefault());
  const out = await withTransaction(async (conn) => {
    let uid;
    try {
      const [u] = await conn.execute(
        "INSERT INTO usuarios (rol, nombre, apellido, email, telefono, password_hash, debe_cambiar_password) VALUES ('tecnico',?,?,?,?,?,1)",
        [d.nombre, d.apellido, d.email, d.telefono, hash]);
      uid = u.insertId;
    } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw conflict('Ya existe una cuenta con ese email'); throw e; }
    const [t] = await conn.execute(
      'INSERT INTO tecnicos (usuario_id, local_id, especialidad, limite_consultas) VALUES (?,?,?,?)', [uid, d.local_id, d.especialidad, limite]);
    await audit(conn, req.user.id, 'tecnico.creado', 'tecnico', t.insertId, { email: d.email, local_id: d.local_id, limite });
    return t.insertId;
  });
  await reintentarPendientes(req.user.id); // un técnico nuevo agrega capacidad
  // La contraseña temporal se muestra UNA vez; el técnico debe cambiarla en su primer ingreso.
  res.status(201).json({ id: out, password_temporal: temporal });
}));

router.put('/tecnicos/:id', ah(async (req, res) => {
  const id = idParam(req.params.id);
  const d = parse(schemas.tecnicoEditar, req.body);
  const [rows] = await pool.execute('SELECT t.id, t.usuario_id FROM tecnicos t WHERE t.id=?', [id]);
  if (!rows[0]) throw notFound('Técnico no encontrado');
  if (d.local_id) {
    const [loc] = await pool.execute('SELECT id FROM locales WHERE id=? AND activo=1', [d.local_id]);
    if (!loc[0]) throw badRequest('El local indicado no existe o está inactivo');
  }
  await withTransaction(async (conn) => {
    const uCampos = ['nombre', 'apellido', 'telefono'].filter((k) => d[k] !== undefined);
    if (uCampos.length) await conn.execute(`UPDATE usuarios SET ${uCampos.map((k) => `${k}=?`).join(',')} WHERE id=?`, [...uCampos.map((k) => d[k]), rows[0].usuario_id]);
    const tCampos = ['local_id', 'especialidad', 'limite_consultas', 'habilitado'].filter((k) => d[k] !== undefined);
    if (tCampos.length) await conn.execute(`UPDATE tecnicos SET ${tCampos.map((k) => `${k}=?`).join(',')} WHERE id=?`, [...tCampos.map((k) => (typeof d[k] === 'boolean' ? Number(d[k]) : d[k])), id]);
    await audit(conn, req.user.id, 'tecnico.editado', 'tecnico', id, d);
    if (d.habilitado === false) await liberarConsultas(conn, id);
  });
  await reintentarPendientes(req.user.id); // subir el límite o rehabilitar también agrega capacidad
  res.json({ ok: true });
}));

router.put('/tecnicos/:id/password', ah(async (req, res) => {
  const id = idParam(req.params.id);
  const { password } = parse(schemas.tecnicoPassword, req.body);
  const hash = await bcrypt.hash(password, env.bcryptRounds);
  await withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT t.usuario_id FROM tecnicos t JOIN usuarios u ON u.id = t.usuario_id WHERE t.id = ? AND u.deleted_at IS NULL FOR UPDATE',
      [id],
    );
    if (!rows[0]) throw notFound('Técnico no encontrado');
    await conn.execute(
      'UPDATE usuarios SET password_hash = ?, debe_cambiar_password = 1 WHERE id = ?',
      [hash, rows[0].usuario_id],
    );
    await audit(conn, req.user.id, 'tecnico.password_restablecida', 'tecnico', id);
  });
  res.json({ ok: true });
}));

// Si un técnico deja de estar disponible, sus consultas activas vuelven a "pendiente" para reasignarse.
async function liberarConsultas(conn, tecnicoId) {
  await conn.execute(
    "UPDATE consultas SET estado='pendiente', tecnico_id=NULL, asignada_at=NULL WHERE tecnico_id=? AND estado IN ('asignada','en_proceso','esperando_cliente')", [tecnicoId]);
}

router.post('/tecnicos/:id/estado', ah(async (req, res) => {
  const id = idParam(req.params.id);
  const activo = req.body?.activo;
  if (typeof activo !== 'boolean') throw badRequest('"activo" debe ser true o false');
  const [rows] = await pool.execute('SELECT usuario_id FROM tecnicos WHERE id=?', [id]);
  if (!rows[0]) throw notFound('Técnico no encontrado');
  await withTransaction(async (conn) => {
    await conn.execute('UPDATE usuarios SET activo=? WHERE id=? AND deleted_at IS NULL', [Number(activo), rows[0].usuario_id]);
    await audit(conn, req.user.id, activo ? 'tecnico.activado' : 'tecnico.desactivado', 'tecnico', id);
    if (!activo) await liberarConsultas(conn, id);
  });
  await reintentarPendientes(req.user.id);
  res.json({ ok: true });
}));

// Eliminación lógica: el usuario queda con deleted_at, se conserva todo su historial.
router.delete('/tecnicos/:id', ah(async (req, res) => {
  const id = idParam(req.params.id);
  const [rows] = await pool.execute('SELECT usuario_id FROM tecnicos WHERE id=?', [id]);
  if (!rows[0]) throw notFound('Técnico no encontrado');
  await withTransaction(async (conn) => {
    await conn.execute('UPDATE usuarios SET activo=0, deleted_at=UTC_TIMESTAMP() WHERE id=?', [rows[0].usuario_id]);
    await conn.execute('UPDATE tecnicos SET habilitado=0 WHERE id=?', [id]);
    await liberarConsultas(conn, id);
    await audit(conn, req.user.id, 'tecnico.eliminado_logico', 'tecnico', id);
  });
  await reintentarPendientes(req.user.id);
  res.json({ ok: true });
}));

// ---------- Locales ----------
router.get('/locales', ah(async (_req, res) => res.json({ locales: await statsLocales() })));

router.post('/locales', ah(async (req, res) => {
  const d = parse(schemas.local, req.body);
  try {
    const [r] = await pool.execute('INSERT INTO locales (nombre, direccion, ciudad, telefono) VALUES (?,?,?,?)', [d.nombre, d.direccion, d.ciudad, d.telefono]);
    await audit(null, req.user.id, 'local.creado', 'local', r.insertId, d);
    res.status(201).json({ id: r.insertId });
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw conflict('Ya existe un local con ese nombre'); throw e; }
}));

router.put('/locales/:id', ah(async (req, res) => {
  const id = idParam(req.params.id);
  const d = parse(schemas.local, req.body);
  try {
    const [r] = await pool.execute('UPDATE locales SET nombre=?, direccion=?, ciudad=?, telefono=?, activo=COALESCE(?, activo) WHERE id=?',
      [d.nombre, d.direccion, d.ciudad, d.telefono, d.activo === undefined ? null : Number(d.activo), id]);
    if (!r.affectedRows) throw notFound('Local no encontrado');
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw conflict('Ya existe un local con ese nombre'); throw e; }
  await audit(null, req.user.id, 'local.editado', 'local', id, d);
  res.json({ ok: true });
}));

// "Eliminar" un local = desactivarlo (hay técnicos y consultas que lo referencian).
router.delete('/locales/:id', ah(async (req, res) => {
  const id = idParam(req.params.id);
  const [r] = await pool.execute('UPDATE locales SET activo=0 WHERE id=?', [id]);
  if (!r.affectedRows) throw notFound('Local no encontrado');
  await audit(null, req.user.id, 'local.desactivado', 'local', id);
  res.json({ ok: true });
}));

// ---------- Consultas pendientes / asignación ----------
router.get('/consultas/pendientes', ah(async (_req, res) => {
  const [rows] = await pool.execute(`${SELECT_CONSULTA} WHERE c.estado='pendiente' ORDER BY c.id`);
  res.json({ consultas: rows });
}));
router.post('/consultas/reintentar', ah(async (req, res) => res.json(await reintentarPendientes(req.user.id))));
router.post('/consultas/:id/asignar', ah(async (req, res) => {
  const id = idParam(req.params.id);
  const [c] = await pool.execute('SELECT estado FROM consultas WHERE id=?', [id]);
  if (!c[0]) throw notFound('Consulta no encontrada');
  if (c[0].estado !== 'pendiente') throw conflict('Solo se pueden asignar consultas pendientes');
  const tecnicoId = await asignarConsulta(id, req.user.id);
  res.json({ asignada: !!tecnicoId, tecnico_id: tecnicoId });
}));

// ---------- Valoraciones ----------
router.get('/valoraciones', ah(async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT v.id, v.consulta_id, v.estrellas, v.comentario, v.created_at, cu.nombre AS cliente_nombre, cu.apellido AS cliente_apellido,
            tu.nombre AS tecnico_nombre, tu.apellido AS tecnico_apellido, l.nombre AS local_nombre
       FROM valoraciones v JOIN usuarios cu ON cu.id=v.cliente_id JOIN tecnicos t ON t.id=v.tecnico_id
       JOIN usuarios tu ON tu.id=t.usuario_id JOIN locales l ON l.id=t.local_id ORDER BY v.id DESC LIMIT 500`);
  res.json({ valoraciones: rows });
}));

// ---------- Configuración y auditoría ----------
router.get('/configuracion', ah(async (_req, res) => res.json({ limite_consultas_default: await limiteDefault() })));
router.put('/configuracion', ah(async (req, res) => {
  const d = parse(schemas.config, req.body);
  await pool.execute("UPDATE configuracion SET valor=? WHERE clave='limite_consultas_default'", [String(d.limite_consultas_default)]);
  await audit(null, req.user.id, 'configuracion.editada', 'configuracion', null, d);
  res.json({ limite_consultas_default: d.limite_consultas_default });
}));
router.get('/auditoria', ah(async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT a.id, a.usuario_id, u.email AS usuario_email, a.accion, a.entidad, a.entidad_id, a.detalle, a.created_at
       FROM auditoria a LEFT JOIN usuarios u ON u.id=a.usuario_id ORDER BY a.id DESC LIMIT 200`);
  res.json({ auditoria: rows.map((r) => ({ ...r, detalle: typeof r.detalle === 'string' ? JSON.parse(r.detalle) : r.detalle })) });
}));

export default router;
