import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'tecnofix_token';

/** Firma un JWT con identidad y rol; no incluye datos de perfil que puedan quedar desactualizados. */
export function signToken(usuario) {
  return jwt.sign({ sub: usuario.id, rol: usuario.rol }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}
/** Verifica firma y vigencia del JWT, y devuelve su payload. */
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
/** Opciones comunes de cookie de sesión, inaccesible desde JavaScript del navegador. */
export function cookieOptions() {
  return { httpOnly: true, sameSite: env.cookie.sameSite, secure: env.cookie.secure, path: '/', maxAge: 8 * 60 * 60 * 1000 };
}
