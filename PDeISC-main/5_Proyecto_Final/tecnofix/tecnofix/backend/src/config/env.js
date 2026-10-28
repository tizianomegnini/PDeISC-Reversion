import dotenv from 'dotenv';
dotenv.config();

// El runner de Node define NODE_TEST_CONTEXT en los procesos de prueba: así nunca se toca la base real aunque falte NODE_ENV.
const isTest = process.env.NODE_ENV === 'test' || !!process.env.NODE_TEST_CONTEXT;

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}. Revise su archivo backend/.env`);
  return v;
}

const corsOrigins = new Set([
  'http://localhost:5173',
  'https://p-de-isc-6uxr.vercel.app',
  ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest,
  port: Number(process.env.PORT || 3000),
  corsOrigins: [...corsOrigins],
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // En pruebas se usa SIEMPRE una base distinta para no tocar los datos reales.
    database: isTest
      ? process.env.DB_NAME_TEST || `${process.env.DB_NAME || 'tecnofix'}_test`
      : process.env.DB_NAME || 'tecnofix',
  },
  jwtSecret: isTest ? process.env.JWT_SECRET || 'test-secret-solo-para-pruebas' : required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  bcryptRounds: isTest ? 4 : Number(process.env.BCRYPT_ROUNDS || 12),
  cookie: {
    sameSite: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
    secure: process.env.COOKIE_SECURE === undefined
      ? process.env.NODE_ENV === 'production'
      : process.env.COOKIE_SECURE === 'true',
  },
};
