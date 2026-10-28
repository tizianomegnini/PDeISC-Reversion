import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'tecnofix_token';

export function signToken(usuario) {
  return jwt.sign({ sub: usuario.id, rol: usuario.rol }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
export function cookieOptions() {
  return { httpOnly: true, sameSite: env.cookie.sameSite, secure: env.cookie.secure, path: '/', maxAge: 8 * 60 * 60 * 1000 };
}
