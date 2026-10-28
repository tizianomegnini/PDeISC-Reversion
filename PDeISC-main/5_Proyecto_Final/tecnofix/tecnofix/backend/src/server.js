import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

try {
  await pool.query('SELECT 1');
} catch (e) {
  console.error(`\nNo se pudo conectar a MySQL (${env.db.host}:${env.db.port}, base "${env.db.database}"): ${e.message}`);
  console.error('Verifique que el servicio MySQL esté iniciado, las credenciales de backend/.env y que haya ejecutado "npm run db:init".\n');
  process.exit(1);
}
createApp().listen(env.port, () => console.log(`API TecnoFix escuchando en http://localhost:${env.port}/api/v1`));
