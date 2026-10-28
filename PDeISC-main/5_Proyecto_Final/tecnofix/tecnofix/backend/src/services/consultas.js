import { pool } from '../config/db.js';
import { notFound } from '../utils/errors.js';

export const SELECT_CONSULTA = `
  SELECT c.id, c.cliente_id, c.tecnico_id, c.tipo_equipo, c.marca, c.modelo, c.descripcion, c.estado,
         c.asignada_at, c.finalizada_at, c.created_at, c.updated_at,
         cu.nombre AS cliente_nombre, cu.apellido AS cliente_apellido, cu.email AS cliente_email, cu.telefono AS cliente_telefono,
         tu.nombre AS tecnico_nombre, tu.apellido AS tecnico_apellido,
         l.id AS local_id, l.nombre AS local_nombre, l.direccion AS local_direccion, l.ciudad AS local_ciudad,
         v.estrellas AS valoracion_estrellas, v.comentario AS valoracion_comentario
    FROM consultas c
    JOIN usuarios cu ON cu.id = c.cliente_id
    LEFT JOIN tecnicos t ON t.id = c.tecnico_id
    LEFT JOIN usuarios tu ON tu.id = t.usuario_id
    LEFT JOIN locales l ON l.id = t.local_id
    LEFT JOIN valoraciones v ON v.consulta_id = c.id`;

/** Devuelve la consulta solo si el usuario tiene derecho a verla; si no, responde 404 (no revela si existe). */
export async function consultaAutorizada(user, id, conn = pool) {
  const [rows] = await conn.execute(`${SELECT_CONSULTA} WHERE c.id = ?`, [id]);
  const c = rows[0];
  const ok = c && (
    user.rol === 'admin' ||
    (user.rol === 'cliente' && c.cliente_id === user.id) ||
    (user.rol === 'tecnico' && user.tecnico_id && c.tecnico_id === user.tecnico_id)
  );
  if (!ok) throw notFound('Consulta no encontrada');
  return c;
}

/** Transiciones permitidas por rol. Clave: estado actual -> estados destino. */
export const TRANSICIONES = {
  tecnico: {
    asignada: ['en_proceso'],
    en_proceso: ['esperando_cliente', 'finalizada'],
    esperando_cliente: ['en_proceso', 'finalizada'],
  },
  cliente: {
    pendiente: ['cancelada'], asignada: ['cancelada'], en_proceso: ['cancelada'], esperando_cliente: ['cancelada'],
  },
};
