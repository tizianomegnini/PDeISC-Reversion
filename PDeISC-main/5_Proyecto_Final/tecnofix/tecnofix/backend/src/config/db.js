import mysql from 'mysql2/promise';
import { env } from './env.js';

/** Pool compartido de MySQL; las transacciones obtienen conexiones exclusivas del pool. */
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

/**
 * Ejecuta una operación con conexión dedicada y confirma o revierte la transacción completa.
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} fn Operación que usa la conexión.
 * @returns {Promise<any>} Resultado de fn tras confirmar la transacción.
 */
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

/**
 * Registra una acción con sus datos asociados; acepta una conexión transaccional o usa el pool.
 * @param {import('mysql2/promise').PoolConnection|null} conn Conexión activa, o null para usar el pool.
 */
export async function audit(conn, usuarioId, accion, entidad, entidadId, detalle = null) {
  await (conn || pool).execute(
    'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle) VALUES (?,?,?,?,?)',
    [usuarioId ?? null, accion, entidad, entidadId ?? null, detalle ? JSON.stringify(detalle) : null],
  );
}
