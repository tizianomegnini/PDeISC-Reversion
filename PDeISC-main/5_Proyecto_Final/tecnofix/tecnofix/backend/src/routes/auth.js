import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { pool, audit } from '../config/db.js';
import { env } from '../config/env.js';
import { ah, unauthorized, conflict, badRequest, HttpError } from '../utils/errors.js';
import { parse, schemas } from '../utils/validate.js';
import { signToken, cookieOptions, COOKIE_NAME } from '../utils/tokens.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const DUMMY_HASH = bcrypt.hashSync('dummy-password-1', 4); // evita revelar por tiempo si el email existe

const limiter = env.isTest
  ? (_req, _res, next) => next()
  : rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Demasiados intentos. Espere unos minutos.' } });

export const publico = (u) => ({
  id: u.id, rol: u.rol, nombre: u.nombre, apellido: u.apellido, email: u.email, telefono: u.telefono ?? null,
  tecnico_id: u.tecnico_id ?? null, debe_cambiar_password: !!u.debe_cambiar_password,
});

function abrirSesion(req, res, u) {
  const token = signToken(u);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  // Las apps móviles (sin cookies) piden el token explícitamente con X-Client: mobile
  return req.headers['x-client'] === 'mobile' ? { token } : {};
}

router.post('/register', limiter, ah(async (req, res) => {
  const d = parse(schemas.register, req.body);
  const hash = await bcrypt.hash(d.password, env.bcryptRounds);
  let id;
  try {
    const [r] = await pool.execute(
      "INSERT INTO usuarios (rol, nombre, apellido, email, telefono, password_hash) VALUES ('cliente',?,?,?,?,?)",
      [d.nombre, d.apellido, d.email, d.telefono, hash],
    );
    id = r.insertId;
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw conflict('Ya existe una cuenta con ese email');
    throw e;
  }
  const u = { id, rol: 'cliente', nombre: d.nombre, apellido: d.apellido, email: d.email, telefono: d.telefono };
  res.status(201).json({ usuario: publico(u), ...abrirSesion(req, res, u) });
}));

router.post('/login', limiter, ah(async (req, res) => {
  const d = parse(schemas.login, req.body);
  const [rows] = await pool.execute(
    `SELECT u.*, t.id AS tecnico_id FROM usuarios u LEFT JOIN tecnicos t ON t.usuario_id = u.id WHERE u.email = ?`, [d.email]);
  const u = rows[0];
  const ok = await bcrypt.compare(d.password, u ? u.password_hash : DUMMY_HASH);
  if (!u || !ok || !u.activo || u.deleted_at) throw unauthorized('Email o contraseña incorrectos');
  res.json({ usuario: publico(u), ...abrirSesion(req, res, u) });
}));

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

router.get('/me', authenticate({ allowPasswordChange: true }), (req, res) => res.json({ usuario: publico(req.user) }));

router.put('/me', authenticate(), ah(async (req, res) => {
  const d = parse(schemas.updateProfile, req.body);
  await pool.execute('UPDATE usuarios SET nombre=?, apellido=?, telefono=? WHERE id=?', [d.nombre, d.apellido, d.telefono, req.user.id]);
  res.json({ usuario: publico({ ...req.user, ...d }) });
}));

router.post('/change-password', authenticate({ allowPasswordChange: true }), ah(async (req, res) => {
  const d = parse(schemas.changePassword, req.body);
  const [rows] = await pool.execute('SELECT password_hash FROM usuarios WHERE id=?', [req.user.id]);
  if (!(await bcrypt.compare(d.actual, rows[0].password_hash))) throw badRequest('La contraseña actual es incorrecta');
  if (d.actual === d.nueva) throw badRequest('La nueva contraseña debe ser distinta de la actual');
  const hash = await bcrypt.hash(d.nueva, env.bcryptRounds);
  await pool.execute('UPDATE usuarios SET password_hash=?, debe_cambiar_password=0 WHERE id=?', [hash, req.user.id]);
  await audit(null, req.user.id, 'usuario.password_cambiada', 'usuario', req.user.id);
  res.json({ usuario: publico({ ...req.user, debe_cambiar_password: 0 }) });
}));

// ---- Login social: estructura lista, proveedores SIN configurar (no se simula ningún login exitoso) ----
const PROVEEDORES = {
  google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  facebook: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
  apple: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
};
const configurado = (p) => PROVEEDORES[p].every((k) => !!process.env[k]);

router.get('/social', (_req, res) =>
  res.json({ proveedores: Object.keys(PROVEEDORES).map((p) => ({ proveedor: p, configurado: configurado(p) })) }));

router.all('/social/:proveedor', (req, _res, next) => {
  const p = req.params.proveedor;
  if (!PROVEEDORES[p]) return next(new HttpError(404, 'Proveedor desconocido'));
  next(new HttpError(501, configurado(p)
    ? `El inicio de sesión con ${p} tiene credenciales cargadas pero la integración todavía no está implementada.`
    : `El inicio de sesión con ${p} está pendiente de configuración (faltan credenciales del proveedor).`));
});

export default router;
