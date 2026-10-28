import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
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

const GOOGLE_STATE_COOKIE = 'tecnofix_google_state';
const FACEBOOK_STATE_COOKIE = 'tecnofix_facebook_state';
const GOOGLE_STATE_MAX_AGE = 10 * 60 * 1000;
const GOOGLE_CALLBACK_PATH = '/api/v1/auth/social/google/callback';
const FACEBOOK_CALLBACK_PATH = '/api/v1/auth/social/facebook/callback';
const FACEBOOK_GRAPH_VERSION = 'v26.0';
const googleClient = () => new OAuth2Client(
  env.google.clientId,
  env.google.clientSecret,
  env.google.redirectUri,
);
const googleConfigurado = () => !!(env.google.clientId && env.google.clientSecret);
const facebookConfigurado = () => !!(env.facebook.appId && env.facebook.appSecret);
const frontendLoginUrl = (error) => {
  const url = new URL('/login', env.frontendUrl);
  if (error) url.searchParams.set('social_error', error);
  return url.toString();
};
const googleStateCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  path: GOOGLE_CALLBACK_PATH,
  maxAge: GOOGLE_STATE_MAX_AGE,
});
const facebookStateCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  path: FACEBOOK_CALLBACK_PATH,
  maxAge: GOOGLE_STATE_MAX_AGE,
});
function estadoValido(state, cookieState) {
  if (typeof state !== 'string' || typeof cookieState !== 'string') return false;
  const recibido = Buffer.from(state);
  const esperado = Buffer.from(cookieState);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}
class GoogleLoginError extends Error {
  constructor(code) { super(code); this.code = code; }
}
class FacebookLoginError extends Error {
  constructor(code) { super(code); this.code = code; }
}

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

// ---- Login social ----
const PROVEEDORES = {
  google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  facebook: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
  apple: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
};
const configurado = (p) => p === 'google'
  ? googleConfigurado()
  : p === 'facebook'
    ? facebookConfigurado()
  : PROVEEDORES[p].every((k) => !!process.env[k]);

router.get('/social', (_req, res) =>
  res.json({ proveedores: Object.keys(PROVEEDORES).map((p) => ({ proveedor: p, configurado: configurado(p) })) }));

router.get('/social/google', (_req, res, next) => {
  if (!googleConfigurado()) {
    return next(new HttpError(501, 'El inicio de sesión con Google está pendiente de configuración (faltan credenciales del proveedor).'));
  }
  const state = randomBytes(32).toString('hex');
  res.cookie(GOOGLE_STATE_COOKIE, state, googleStateCookieOptions());
  res.redirect(googleClient().generateAuthUrl({
    access_type: 'online',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile'],
    state,
  }));
});

router.get('/social/facebook', (_req, res, next) => {
  if (!facebookConfigurado()) {
    return next(new HttpError(501, 'El inicio de sesión con Facebook está pendiente de configuración (faltan credenciales del proveedor).'));
  }
  const state = randomBytes(32).toString('hex');
  const query = new URLSearchParams({
    client_id: env.facebook.appId,
    redirect_uri: env.facebook.redirectUri,
    response_type: 'code',
    scope: 'email,public_profile',
    state,
  });
  res.cookie(FACEBOOK_STATE_COOKIE, state, facebookStateCookieOptions());
  res.redirect(`https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth?${query}`);
});

async function facebookJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.error) throw new FacebookLoginError('facebook_failed');
  return data;
}

async function usuarioFacebook(profile) {
  const email = profile.email.toLowerCase();
  const buscarPorFacebook = async () => {
    const [rows] = await pool.execute(
      `SELECT u.*, t.id AS tecnico_id FROM usuarios u
       LEFT JOIN tecnicos t ON t.usuario_id = u.id
       WHERE u.proveedor_social='facebook' AND u.proveedor_social_id=? LIMIT 1`,
      [profile.id],
    );
    return rows[0];
  };
  const buscarPorEmail = async () => {
    const [rows] = await pool.execute(
      `SELECT u.*, t.id AS tecnico_id FROM usuarios u
       LEFT JOIN tecnicos t ON t.usuario_id = u.id WHERE u.email=? LIMIT 1`,
      [email],
    );
    return rows[0];
  };
  const validarCuenta = (usuario) => {
    if (!usuario) throw new FacebookLoginError('facebook_failed');
    if (!usuario.activo || usuario.deleted_at) throw new FacebookLoginError('account_unavailable');
    if (usuario.proveedor_social !== 'facebook' || usuario.proveedor_social_id !== profile.id) {
      throw new FacebookLoginError('facebook_account_exists');
    }
  };

  let usuario = await buscarPorFacebook();
  if (usuario) {
    validarCuenta(usuario);
    return usuario;
  }
  if (await buscarPorEmail()) throw new FacebookLoginError('facebook_account_exists');

  const passwordHash = await bcrypt.hash(randomBytes(48).toString('hex'), env.bcryptRounds);
  const nombre = (profile.first_name || profile.name?.split(/\s+/)[0] || email.split('@')[0]).slice(0, 80);
  const apellido = (profile.last_name || profile.name?.split(/\s+/).slice(1).join(' ') || '').slice(0, 80);
  try {
    const [result] = await pool.execute(
      `INSERT INTO usuarios (rol, nombre, apellido, email, password_hash, proveedor_social, proveedor_social_id)
       VALUES ('cliente',?,?,?,?, 'facebook',?)`,
      [nombre, apellido, email, passwordHash, profile.id],
    );
    const [rows] = await pool.execute(
      `SELECT u.*, t.id AS tecnico_id FROM usuarios u
       LEFT JOIN tecnicos t ON t.usuario_id = u.id WHERE u.id=?`,
      [result.insertId],
    );
    return rows[0];
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    usuario = await buscarPorFacebook();
    if (usuario) {
      validarCuenta(usuario);
      return usuario;
    }
    if (await buscarPorEmail()) throw new FacebookLoginError('facebook_account_exists');
    throw error;
  }
}

router.get('/social/facebook/callback', async (req, res) => {
  const state = req.query.state;
  const expectedState = req.cookies[FACEBOOK_STATE_COOKIE];
  res.clearCookie(FACEBOOK_STATE_COOKIE, { ...facebookStateCookieOptions(), maxAge: undefined });
  if (!estadoValido(state, expectedState)) return res.redirect(frontendLoginUrl('facebook_state_invalid'));
  if (req.query.error) {
    return res.redirect(frontendLoginUrl(req.query.error === 'access_denied' ? 'facebook_cancelled' : 'facebook_failed'));
  }
  if (typeof req.query.code !== 'string') return res.redirect(frontendLoginUrl('facebook_failed'));

  try {
    const graphUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}`;
    const tokenQuery = new URLSearchParams({
      client_id: env.facebook.appId,
      client_secret: env.facebook.appSecret,
      redirect_uri: env.facebook.redirectUri,
      code: req.query.code,
    });
    const token = await facebookJson(`${graphUrl}/oauth/access_token?${tokenQuery}`);
    if (typeof token.access_token !== 'string') throw new FacebookLoginError('facebook_failed');

    const debugQuery = new URLSearchParams({
      input_token: token.access_token,
      access_token: `${env.facebook.appId}|${env.facebook.appSecret}`,
    });
    const debug = await facebookJson(`${graphUrl}/debug_token?${debugQuery}`);
    const tokenData = debug.data;
    if (!tokenData?.is_valid || tokenData.app_id !== env.facebook.appId) {
      throw new FacebookLoginError('facebook_failed');
    }

    const appSecretProof = createHmac('sha256', env.facebook.appSecret).update(token.access_token).digest('hex');
    const profileQuery = new URLSearchParams({ fields: 'id,name,first_name,last_name,email', access_token: token.access_token, appsecret_proof: appSecretProof });
    const profile = await facebookJson(`${graphUrl}/me?${profileQuery}`);
    if (!profile.id || profile.id !== tokenData.user_id) throw new FacebookLoginError('facebook_failed');
    if (!profile.email) throw new FacebookLoginError('facebook_email_missing');

    const usuario = await usuarioFacebook(profile);
    abrirSesion(req, res, usuario);
    return res.redirect(frontendLoginUrl());
  } catch (error) {
    if (error instanceof FacebookLoginError) return res.redirect(frontendLoginUrl(error.code));
    console.error('Falló el callback de inicio de sesión de Facebook:', error);
    return res.redirect(frontendLoginUrl('facebook_failed'));
  }
});

async function usuarioGoogle(payload) {
  const email = payload.email.toLowerCase();
  const sub = payload.sub;
  const buscarPorGoogle = async () => {
    const [rows] = await pool.execute(
      `SELECT u.*, t.id AS tecnico_id FROM usuarios u
       LEFT JOIN tecnicos t ON t.usuario_id = u.id
       WHERE u.proveedor_social='google' AND u.proveedor_social_id=? LIMIT 1`,
      [sub],
    );
    return rows[0];
  };
  const buscarPorEmail = async () => {
    const [rows] = await pool.execute(
      `SELECT u.*, t.id AS tecnico_id FROM usuarios u
       LEFT JOIN tecnicos t ON t.usuario_id = u.id WHERE u.email=? LIMIT 1`,
      [email],
    );
    return rows[0];
  };
  const validarCuenta = (usuario) => {
    if (!usuario) throw new GoogleLoginError('google_failed');
    if (!usuario.activo || usuario.deleted_at) throw new GoogleLoginError('account_unavailable');
    if ((usuario.proveedor_social || usuario.proveedor_social_id)
      && (usuario.proveedor_social !== 'google' || usuario.proveedor_social_id !== sub)) {
      throw new GoogleLoginError('account_provider_mismatch');
    }
  };
  const buscarPorId = async (id) => {
    const [rows] = await pool.execute(
      `SELECT u.*, t.id AS tecnico_id FROM usuarios u
       LEFT JOIN tecnicos t ON t.usuario_id = u.id WHERE u.id=? LIMIT 1`,
      [id],
    );
    return rows[0];
  };

  let usuario = await buscarPorGoogle();
  if (usuario) validarCuenta(usuario);
  if (!usuario) {
    usuario = await buscarPorEmail();
    if (usuario) validarCuenta(usuario);
    if (!usuario) {
      const passwordHash = await bcrypt.hash(randomBytes(48).toString('hex'), env.bcryptRounds);
      const nombre = (payload.given_name || payload.name?.split(/\s+/)[0] || email.split('@')[0]).slice(0, 80);
      const apellido = (payload.family_name || payload.name?.split(/\s+/).slice(1).join(' ') || '').slice(0, 80);
      try {
        const [result] = await pool.execute(
          `INSERT INTO usuarios (rol, nombre, apellido, email, password_hash, proveedor_social, proveedor_social_id)
           VALUES ('cliente',?,?,?,?, 'google',?)`,
          [nombre, apellido, email, passwordHash, sub],
        );
        usuario = { id: result.insertId };
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
        usuario = await buscarPorGoogle() || await buscarPorEmail();
        if (!usuario) throw error;
        validarCuenta(usuario);
      }
    }
    if (usuario.proveedor_social == null && usuario.proveedor_social_id == null) {
      const [result] = await pool.execute(
        `UPDATE usuarios SET proveedor_social='google', proveedor_social_id=?
         WHERE id=? AND proveedor_social IS NULL AND proveedor_social_id IS NULL`,
        [sub, usuario.id],
      );
      if (!result.affectedRows) usuario = await buscarPorGoogle() || await buscarPorEmail();
    }
  }

  if (!usuario) throw new GoogleLoginError('google_failed');
  usuario = await buscarPorId(usuario.id);
  validarCuenta(usuario);
  return usuario;
}

router.get('/social/google/callback', async (req, res) => {
  const state = req.query.state;
  const expectedState = req.cookies[GOOGLE_STATE_COOKIE];
  res.clearCookie(GOOGLE_STATE_COOKIE, { ...googleStateCookieOptions(), maxAge: undefined });
  if (!estadoValido(state, expectedState)) return res.redirect(frontendLoginUrl('google_state_invalid'));
  if (req.query.error) {
    return res.redirect(frontendLoginUrl(req.query.error === 'access_denied' ? 'google_cancelled' : 'google_failed'));
  }
  if (typeof req.query.code !== 'string') return res.redirect(frontendLoginUrl('google_failed'));

  try {
    const client = googleClient();
    const { tokens } = await client.getToken(req.query.code);
    if (!tokens.id_token) throw new GoogleLoginError('google_failed');
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: env.google.clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new GoogleLoginError('google_email_unverified');
    }
    const usuario = await usuarioGoogle(payload);
    abrirSesion(req, res, usuario);
    return res.redirect(frontendLoginUrl());
  } catch (error) {
    if (error instanceof GoogleLoginError) return res.redirect(frontendLoginUrl(error.code));
    console.error('Falló el callback de inicio de sesión de Google:', error);
    return res.redirect(frontendLoginUrl('google_failed'));
  }
});

router.all('/social/:proveedor', (req, _res, next) => {
  const p = req.params.proveedor;
  if (!PROVEEDORES[p]) return next(new HttpError(404, 'Proveedor desconocido'));
  next(new HttpError(501, configurado(p)
    ? `El inicio de sesión con ${p} tiene credenciales cargadas pero la integración todavía no está implementada.`
    : `El inicio de sesión con ${p} está pendiente de configuración (faltan credenciales del proveedor).`));
});

export default router;
