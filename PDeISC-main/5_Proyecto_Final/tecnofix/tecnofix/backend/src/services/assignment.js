import { pool, withTransaction, audit } from '../config/db.js';

/** Estados que consumen cupo del técnico. Deben coincidir con el comentario de schema.sql. */
export const ESTADOS_ACTIVOS = ['asignada', 'en_proceso', 'esperando_cliente'];
const IN_ACTIVOS = ESTADOS_ACTIVOS.map((e) => `'${e}'`).join(',');

/**
 * Promedio bayesiano para que pocas valoraciones no distorsionen demasiado el orden de prioridad.
 * Un técnico sin valoraciones parte de PRIOR_MEDIA (4.0).
 */
export const PRIOR_MEDIA = 4;
export const PRIOR_PESO = 5;
export const puntaje = (suma, cant) => (Number(suma) + PRIOR_MEDIA * PRIOR_PESO) / (Number(cant) + PRIOR_PESO);

export async function limiteDefault(conn = pool) {
  const [r] = await conn.execute("SELECT valor FROM configuracion WHERE clave='limite_consultas_default'");
  return r[0] ? Number(r[0].valor) : 20;
}

/**
 * Asigna UNA consulta pendiente. Debe ejecutarse dentro de una transacción.
 * Bloquea (SELECT ... FOR UPDATE) las filas de los técnicos candidatos, siempre en orden de id,
 * de modo que dos asignaciones simultáneas se serializan y nunca superan el límite.
 * Devuelve el id del técnico asignado o null si nadie tiene cupo.
 */
export async function asignarEnConexion(conn, consultaId, actorId = null) {
  const [cons] = await conn.execute('SELECT id, estado FROM consultas WHERE id = ? FOR UPDATE', [consultaId]);
  if (!cons[0] || cons[0].estado !== 'pendiente') return null;

  const [cands] = await conn.query(
    `SELECT t.id, t.limite_consultas,
            (SELECT COUNT(*) FROM consultas c WHERE c.tecnico_id = t.id AND c.estado IN (${IN_ACTIVOS})) AS activas,
            (SELECT COALESCE(SUM(v.estrellas),0) FROM valoraciones v WHERE v.tecnico_id = t.id) AS suma,
            (SELECT COUNT(*) FROM valoraciones v WHERE v.tecnico_id = t.id) AS cant
       FROM tecnicos t
       JOIN usuarios u ON u.id = t.usuario_id
       JOIN locales l ON l.id = t.local_id
      WHERE t.habilitado = 1 AND u.activo = 1 AND u.deleted_at IS NULL AND l.activo = 1
      ORDER BY t.id
      FOR UPDATE`,
  );

  const elegibles = cands
    .filter((t) => Number(t.activas) < Number(t.limite_consultas))
    .map((t) => ({ ...t, score: puntaje(t.suma, t.cant) }))
    .sort((a, b) => a.score - b.score || a.activas - b.activas || a.id - b.id);

  if (!elegibles.length) return null;
  const elegido = elegibles[0];
  await conn.execute(
    "UPDATE consultas SET tecnico_id = ?, estado = 'asignada', asignada_at = UTC_TIMESTAMP() WHERE id = ? AND estado = 'pendiente'",
    [elegido.id, consultaId],
  );
  await audit(conn, actorId, 'consulta.asignada', 'consulta', consultaId, { tecnico_id: elegido.id, score: Number(elegido.score.toFixed(3)), activas_previas: Number(elegido.activas) });
  return elegido.id;
}

export const asignarConsulta = (consultaId, actorId = null) =>
  withTransaction((conn) => asignarEnConexion(conn, consultaId, actorId));

/** Reintenta asignar las pendientes (más antiguas primero). Corta al primer fallo: si no hay cupo para una, no hay para ninguna. */
export async function reintentarPendientes(actorId = null) {
  const [pend] = await pool.execute("SELECT id FROM consultas WHERE estado = 'pendiente' ORDER BY id");
  let asignadas = 0;
  for (const p of pend) {
    const t = await asignarConsulta(p.id, actorId);
    if (!t) break;
    asignadas++;
  }
  return { pendientes: pend.length, asignadas };
}
