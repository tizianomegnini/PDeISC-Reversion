import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: false,
  timezone: 'Z',
});

/** Ejecuta fn(conn) dentro de una transaccion. Hace rollback si algo falla. */
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    // READ COMMITTED: tras tomar los locks de fila siempre se leen los datos confirmados más recientes
    await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function audit(conn, usuarioId, accion, entidad, entidadId, detalle = null) {
  await (conn || pool).execute(
    'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle) VALUES (?,?,?,?,?)',
    [usuarioId ?? null, accion, entidad, entidadId ?? null, detalle ? JSON.stringify(detalle) : null],
  );
}
