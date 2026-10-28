import mysql from "mysql2/promise";

function createPoolConfig() {
  // Vercel must use Railway's public TCP proxy. MYSQL_URL is often the private
  // Railway URL and cannot be reached from outside the Railway network.
  const connectionUrl = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (connectionUrl) {
    let url;
    try {
      url = new URL(connectionUrl);
    } catch {
      throw new Error("MYSQL_PUBLIC_URL debe ser una URL mysql:// válida de Railway");
    }
    if (!/^mysql:?$/i.test(url.protocol)) {
      throw new Error("La URL de conexión debe usar el protocolo mysql://");
    }
    if (url.hostname.endsWith(".railway.internal")) {
      throw new Error("Vercel no puede acceder al host privado de Railway; configurá MYSQL_PUBLIC_URL con el dominio y puerto TCP públicos de Railway");
    }
    const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
    if (!url.hostname || !database) {
      throw new Error("La URL de Railway debe incluir host y nombre de base de datos");
    }
    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    };
  }

  const requiredVariables = ["MYSQLHOST", "MYSQLPORT", "MYSQLUSER", "MYSQLPASSWORD", "MYSQLDATABASE"];
  const missing = requiredVariables.filter((variable) => !process.env[variable]);
  if (missing.length) {
    throw new Error(`Faltan variables de base de datos: ${missing.join(", ")}. Para Vercel, usá MYSQL_PUBLIC_URL con la conexión TCP pública de Railway.`);
  }
  if (process.env.MYSQLHOST.endsWith(".railway.internal")) {
    throw new Error("MYSQLHOST es privado de Railway y no es accesible desde Vercel; usá el host y puerto TCP públicos de Railway.");
  }
  return {
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
  };
}

function getPool() {
  if (!globalThis.__portfolioMysqlPool) {
    const poolConfig = {
      ...createPoolConfig(),
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 10000,
      ...(process.env.MYSQL_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
    };
    globalThis.__portfolioMysqlPool = mysql.createPool(poolConfig);
  }
  return globalThis.__portfolioMysqlPool;
}

// Defer configuration validation until a handler call, so health.js can return
// a useful JSON error instead of Vercel's generic FUNCTION_INVOCATION_FAILED.
export const pool = {
  execute: (...args) => getPool().execute(...args),
  query: (...args) => getPool().query(...args),
};

export async function ensureSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS portfolio_content (
      id VARCHAR(32) PRIMARY KEY,
      content JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}
