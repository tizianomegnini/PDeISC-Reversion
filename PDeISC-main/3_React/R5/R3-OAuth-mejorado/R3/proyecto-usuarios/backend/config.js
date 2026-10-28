// Configuración central. Se importa PRIMERO para que el .env esté cargado
// antes de que cualquier otro módulo lea process.env.
import 'dotenv/config';

export const PUERTO = Number(process.env.PORT) || 4000;
export const ES_PRODUCCION = process.env.NODE_ENV === 'production';

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
export const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

// Orígenes del front permitidos por CORS (separados por coma en .env).
// Por defecto: los dos frontends de desarrollo (puertos fijos 5173 y 5174).
export const CORS_ORIGINS = (
  process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Falla rápido (con un mensaje claro) si la configuración es inservible.
export function validarConfiguracion() {
  if (!JWT_SECRET) {
    console.error('❌ Falta JWT_SECRET en backend/.env (copiá .env.example a .env y completalo).');
    process.exit(1);
  }
  const debil = JWT_SECRET.length < 16 || JWT_SECRET.startsWith('cambia_esto');
  if (debil) {
    const msg =
      'JWT_SECRET es corto o es el valor de ejemplo. Generá uno real con:\n' +
      '   node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"';
    if (ES_PRODUCCION) {
      console.error(`❌ ${msg}`);
      process.exit(1);
    }
    console.warn(`⚠️  ${msg}`);
  }
}
