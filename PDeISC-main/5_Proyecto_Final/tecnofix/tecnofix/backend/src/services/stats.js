import { pool } from '../config/db.js';
import { ESTADOS_ACTIVOS, puntaje } from './assignment.js';

const IN_ACTIVOS = ESTADOS_ACTIVOS.map((e) => `'${e}'`).join(',');

export async function statsTecnico(tecnicoId) {
  const [r] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM consultas WHERE tecnico_id = ? AND estado = 'finalizada') AS atendidas,
       (SELECT COUNT(*) FROM consultas WHERE tecnico_id = ? AND estado IN (${IN_ACTIVOS})) AS activas,
       (SELECT COUNT(*) FROM valoraciones WHERE tecnico_id = ?) AS cantidad_valoraciones,
       (SELECT AVG(estrellas) FROM valoraciones WHERE tecnico_id = ?) AS promedio`,
    [tecnicoId, tecnicoId, tecnicoId, tecnicoId],
  );
  const s = r[0];
  return {
    atendidas: Number(s.atendidas), activas: Number(s.activas),
    cantidad_valoraciones: Number(s.cantidad_valoraciones),
    promedio: s.promedio === null ? null : Number(Number(s.promedio).toFixed(2)),
  };
}

export async function listarTecnicosConStats() {
  const [rows] = await pool.execute(
    `SELECT t.id, t.usuario_id, t.local_id, t.especialidad, t.limite_consultas, t.habilitado,
            u.nombre, u.apellido, u.email, u.telefono, u.activo, u.deleted_at, u.debe_cambiar_password,
            l.nombre AS local_nombre,
            (SELECT COUNT(*) FROM consultas c WHERE c.tecnico_id = t.id AND c.estado IN (${IN_ACTIVOS})) AS activas,
            (SELECT COUNT(*) FROM consultas c WHERE c.tecnico_id = t.id AND c.estado = 'finalizada') AS atendidas,
            (SELECT COUNT(*) FROM valoraciones v WHERE v.tecnico_id = t.id) AS cantidad_valoraciones,
            (SELECT COALESCE(SUM(v.estrellas),0) FROM valoraciones v WHERE v.tecnico_id = t.id) AS suma
       FROM tecnicos t JOIN usuarios u ON u.id = t.usuario_id JOIN locales l ON l.id = t.local_id
      ORDER BY u.deleted_at IS NOT NULL, l.nombre, u.apellido, u.nombre`,
  );
  return rows.map(({ suma, ...t }) => ({
    ...t,
    activas: Number(t.activas), atendidas: Number(t.atendidas), cantidad_valoraciones: Number(t.cantidad_valoraciones),
    promedio: Number(t.cantidad_valoraciones) ? Number((Number(suma) / Number(t.cantidad_valoraciones)).toFixed(2)) : null,
    puntaje_asignacion: Number(puntaje(suma, t.cantidad_valoraciones).toFixed(2)),
  }));
}

export async function statsLocales() {
  const [rows] = await pool.execute(
    `SELECT l.id, l.nombre, l.direccion, l.ciudad, l.telefono, l.activo,
            (SELECT COUNT(*) FROM tecnicos t JOIN usuarios u ON u.id=t.usuario_id
               WHERE t.local_id=l.id AND t.habilitado=1 AND u.activo=1 AND u.deleted_at IS NULL) AS tecnicos,
            (SELECT COUNT(*) FROM consultas c JOIN tecnicos t ON t.id=c.tecnico_id
               WHERE t.local_id=l.id AND c.estado IN (${IN_ACTIVOS})) AS activas,
            (SELECT COUNT(*) FROM consultas c JOIN tecnicos t ON t.id=c.tecnico_id
               WHERE t.local_id=l.id AND c.estado='finalizada') AS atendidas,
            (SELECT AVG(v.estrellas) FROM valoraciones v JOIN tecnicos t ON t.id=v.tecnico_id WHERE t.local_id=l.id) AS promedio
       FROM locales l ORDER BY l.activo DESC, l.nombre`,
  );
  return rows.map((l) => ({
    ...l, tecnicos: Number(l.tecnicos), activas: Number(l.activas), atendidas: Number(l.atendidas),
    promedio: l.promedio === null ? null : Number(Number(l.promedio).toFixed(2)),
  }));
}

export async function resumenAdmin() {
  const [r] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM consultas) AS consultas_total,
       (SELECT COUNT(*) FROM consultas WHERE estado='pendiente') AS pendientes,
       (SELECT COUNT(*) FROM consultas WHERE estado IN (${IN_ACTIVOS})) AS activas,
       (SELECT COUNT(*) FROM consultas WHERE estado='finalizada') AS finalizadas,
       (SELECT COUNT(*) FROM tecnicos t JOIN usuarios u ON u.id=t.usuario_id WHERE t.habilitado=1 AND u.activo=1 AND u.deleted_at IS NULL) AS tecnicos_habilitados,
       (SELECT COUNT(*) FROM locales WHERE activo=1) AS locales_activos,
       (SELECT COUNT(*) FROM valoraciones) AS valoraciones_total,
       (SELECT AVG(estrellas) FROM valoraciones) AS promedio_general`,
  );
  const x = r[0];
  const out = {};
  for (const k of Object.keys(x)) out[k] = x[k] === null ? null : Number(Number(x[k]).toFixed(2));
  return out;
}
