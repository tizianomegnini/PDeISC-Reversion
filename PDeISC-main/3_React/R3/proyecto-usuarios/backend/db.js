// Conexión a MySQL con un pool (reutiliza conexiones en vez de abrir una
// nueva por cada consulta, que es lo recomendado para una API).
import mysql from 'mysql2/promise';
import './config.js'; // asegura que el .env esté cargado

const HOST = process.env.DB_HOST || 'localhost';
const PORT = Number(process.env.DB_PORT) || 3306;
const USER = process.env.DB_USER || 'root';
const PASSWORD = process.env.DB_PASSWORD ?? '';
const DB_NAME = process.env.DB_NAME || 'usuarios_app';

const pool = mysql.createPool({
  host: HOST,
  port: PORT,
  user: USER,
  password: PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Traduce los errores típicos de MySQL a algo que se pueda accionar.
// Antes, TODOS terminaban como "Error al registrar el usuario" y el motivo
// real solo aparecía (si se miraba) en la consola.
export function explicarErrorDB(err) {
  switch (err.code) {
    case 'ECONNREFUSED':
      return `No se pudo conectar a MySQL en ${HOST}:${PORT}. ¿Está encendido el servidor (servicio MySQL, XAMPP, Docker...)?`;
    case 'ENOTFOUND':
      return `No se encontró el host "${HOST}". Revisá DB_HOST en backend/.env.`;
    case 'ER_ACCESS_DENIED_ERROR':
    case 'ER_ACCESS_DENIED_NO_PASSWORD_ERROR':
      return `MySQL rechazó al usuario "${USER}" (${PASSWORD ? 'con' : 'SIN'} contraseña). Revisá DB_USER y DB_PASSWORD en backend/.env.`;
    case 'ER_BAD_DB_ERROR':
      return `La base "${DB_NAME}" no existe y no se pudo crear. Revisá DB_NAME y los permisos del usuario.`;
    default:
      return `${err.code ? `[${err.code}] ` : ''}${err.message}`;
  }
}

// Crea la base y la tabla si no existen (equivale a ejecutar schema.sql),
// así no hay un paso manual que se pueda olvidar. Es idempotente.
export async function inicializarBD() {
  if (!/^[A-Za-z0-9_]+$/.test(DB_NAME)) {
    throw new Error(`DB_NAME "${DB_NAME}" no es válido (solo letras, números y _).`);
  }

  const conexion = await mysql.createConnection({ host: HOST, port: PORT, user: USER, password: PASSWORD });
  try {
    await conexion.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await conexion.end();
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export default pool;
