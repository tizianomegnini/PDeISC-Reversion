import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_PATH = path.join(here, '..', 'database', 'schema.sql');

/** Crea la base (si no existe) y aplica schema.sql. Con drop=true la borra antes. */
export async function initDatabase({ drop = false } = {}) {
  const { host, port, user, password, database } = env.db;
  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true, charset: 'utf8mb4' });
  try {
    if (drop) await conn.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${database}\``);
    await conn.query(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  } finally { await conn.end(); }
  return database;
}
