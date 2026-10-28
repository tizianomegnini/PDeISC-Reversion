import { pool } from '../config/db.js';
import { ah, unauthorized, forbidden } from '../utils/errors.js';
import { verifyToken, COOKIE_NAME } from '../utils/tokens.js';

/**
 * Verifica identidad en CADA request:
 *  - token por header Authorization: Bearer (apps móviles / pruebas) o cookie httpOnly (web)
 *  - recarga al usuario desde MySQL: si fue desactivado/eliminado, el token deja de servir
 *  - con cookie, las peticiones que modifican datos exigen el header X-Requested-With (defensa CSRF)
 */
export const authenticate = ({ allowPasswordChange = false } = {}) =>
  ah(async (req, _res, next) => {
    let token = null;
    let fromCookie = false;
    const h = req.headers.authorization;
    if (h?.startsWith('Bearer ')) token = h.slice(7);
    else if (req.cookies?.[COOKIE_NAME]) { token = req.cookies[COOKIE_NAME]; fromCookie = true; }
    if (!token) throw unauthorized();

    if (fromCookie && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !req.headers['x-requested-with']) {
      throw forbidden('Falta el encabezado X-Requested-With');
    }

    let payload;
    try { payload = verifyToken(token); } catch { throw unauthorized('Sesión inválida o vencida'); }

    const [rows] = await pool.execute(
      `SELECT u.id, u.rol, u.nombre, u.apellido, u.email, u.telefono, u.activo, u.deleted_at, u.debe_cambiar_password,
              t.id AS tecnico_id
         FROM usuarios u LEFT JOIN tecnicos t ON t.usuario_id = u.id WHERE u.id = ?`,
      [payload.sub],
    );
    const u = rows[0];
    if (!u || !u.activo || u.deleted_at) throw unauthorized('Cuenta inexistente o desactivada');
    if (u.rol !== payload.rol) throw unauthorized('Sesión inválida');
    if (u.debe_cambiar_password && !allowPasswordChange) {
      throw forbidden('Debe cambiar su contraseña inicial antes de continuar');
    }
    req.user = u;
    next();
  });

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.rol) ? next() : next(forbidden());
