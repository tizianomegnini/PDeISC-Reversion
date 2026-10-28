import { initDatabase } from './lib.js';
import { env } from '../src/config/env.js';

const drop = process.argv.includes('--drop');
if (drop && env.nodeEnv === 'production') { console.error('db:reset no está permitido en producción'); process.exit(1); }
try {
  const name = await initDatabase({ drop });
  console.log(`Base "${name}" ${drop ? 'recreada' : 'inicializada'} correctamente.`);
} catch (e) {
  console.error('No se pudo inicializar la base:', e.message);
  process.exit(1);
}
