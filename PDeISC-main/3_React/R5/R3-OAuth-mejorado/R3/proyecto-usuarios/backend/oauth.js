import crypto from 'crypto';
import { URLSearchParams } from 'url';
import pool from './db.js';
import { FRONTEND_URL } from './config.js';
import { firmarToken } from './routes/auth.js';

const CALLBACK_BASE = process.env.OAUTH_CALLBACK_BASE || `http://localhost:${process.env.PORT || 4000}/api/auth/oauth`;
const estados = new Map();
const intercambios = new Map();

function aleatorio(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pkceChallenge(verifier) {
  return base64url(crypto.createHash('sha256').update(verifier).digest());
}

const proveedores = {
  google: {
    label: 'Google',
    color: '#4285F4',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    pkce: true,
    map: (u) => ({ id: u.sub, nombre: u.name || u.email?.split('@')[0], email: u.email, emailVerificado: u.email_verified === true }),
  },
  github: {
    label: 'GitHub',
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    userinfo: 'https://api.github.com/user',
    scope: 'read:user user:email',
    pkce: true,
    map: (u) => ({ id: String(u.id), nombre: u.name || u.login, email: u.email, emailVerificado: Boolean(u.email) }),
    extra: async (accessToken, user) => {
      if (user.email) return user;
      const r = await fetch('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' } });
      // GitHub puede no devolver emails (por ejemplo, si no hay una dirección
      // pública/verificada o el permiso user:email no fue concedido). El email
      // es opcional para OAuth en este proyecto, así que no bloqueamos el login.
      if (!r.ok) {
        console.warn(`[OAuth:github] No se pudo consultar /user/emails (${r.status}); se continuará sin email.`);
        return user;
      }
      const emails = await r.json();
      const principal = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
      return { ...user, email: principal?.email || user.email, email_verified: Boolean(principal?.verified) };
    },
  },
  facebook: {
    label: 'Facebook / Meta',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    authorize: 'https://www.facebook.com/v24.0/dialog/oauth',
    token: 'https://graph.facebook.com/v24.0/oauth/access_token',
    userinfo: 'https://graph.facebook.com/me?fields=id,name,email',
    // En algunas apps creadas con el flujo nuevo de casos de uso de Meta,
    // `email` no queda habilitado automáticamente y Meta rechaza el login con
    // "Invalid Scopes". El perfil público basta para autenticar; email es opcional.
    scope: 'public_profile',
    map: (u) => ({ id: String(u.id), nombre: u.name, email: u.email, emailVerificado: Boolean(u.email) }),
  },
  discord: {
    label: 'Discord',
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    authorize: 'https://discord.com/oauth2/authorize',
    token: 'https://discord.com/api/oauth2/token',
    userinfo: 'https://discord.com/api/users/@me',
    scope: 'identify email',
    map: (u) => ({ id: String(u.id), nombre: u.global_name || u.username, email: u.email, emailVerificado: u.verified === true }),
  },
  spotify: {
    label: 'Spotify',
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    callbackUrl: process.env.SPOTIFY_CALLBACK_URL,
    authorize: 'https://accounts.spotify.com/authorize',
    token: 'https://accounts.spotify.com/api/token',
    userinfo: 'https://api.spotify.com/v1/me',
    scope: 'user-read-email user-read-private',
    basicTokenAuth: true,
    map: (u) => ({ id: String(u.id), nombre: u.display_name || u.id, email: u.email, emailVerificado: Boolean(u.email) }),
  },
};

function disponible(provider) {
  return Boolean(provider.clientId && provider.clientSecret);
}

function callbackUri(providerId, provider) {
  return provider.callbackUrl || `${CALLBACK_BASE}/${providerId}/callback`;
}

export function listaProveedores() {
  return Object.entries(proveedores).map(([id, p]) => ({ id, label: p.label, configurado: disponible(p) }));
}

function limpiarMapas() {
  const ahora = Date.now();
  for (const [k, v] of estados) if (v.expira < ahora) estados.delete(k);
  for (const [k, v] of intercambios) if (v.expira < ahora) intercambios.delete(k);
}

export function iniciarOAuth(providerId, req, res) {
  limpiarMapas();
  const p = proveedores[providerId];
  if (!p) return res.status(404).json({ error: 'Proveedor no soportado' });
  if (!disponible(p)) return res.status(503).json({ error: `${p.label} todavía no está configurado en backend/.env` });

  const state = aleatorio(24);
  const verifier = p.pkce ? aleatorio(48) : null;
  estados.set(state, { providerId, verifier, expira: Date.now() + 10 * 60 * 1000 });

  const params = new URLSearchParams({ client_id: p.clientId, redirect_uri: callbackUri(providerId, p), response_type: 'code', scope: p.scope, state });
  if (verifier) params.set('code_challenge', pkceChallenge(verifier)), params.set('code_challenge_method', 'S256');
  res.redirect(`${p.authorize}?${params}`);
}

async function intercambiarCodigo(p, code, redirectUri, verifier) {
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: p.clientId });
  if (verifier) body.set('code_verifier', verifier);
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };
  if (p.basicTokenAuth) {
    headers.Authorization = `Basic ${Buffer.from(`${p.clientId}:${p.clientSecret}`).toString('base64')}`;
  } else {
    body.set('client_secret', p.clientSecret);
  }
  const r = await fetch(p.token, { method: 'POST', headers, body });
  const text = await r.text();
  if (!r.ok) throw new Error(`El proveedor rechazó el intercambio de código (${r.status}).`);
  const data = new URLSearchParams(text);
  if (text.trim().startsWith('{')) return JSON.parse(text);
  return Object.fromEntries(data.entries());
}

async function obtenerUsuario(p, token) {
  const headers = { Accept: 'application/json', ...(p.headers ? p.headers(token) : { Authorization: `Bearer ${token}` }) };
  const r = await fetch(p.userinfo, { headers });
  if (!r.ok) throw new Error(`No se pudo obtener el perfil del proveedor (${r.status}).`);
  const body = await r.json();
  return p.extract ? p.extract(body) : body;
}

async function autenticarUsuario(providerId, externo) {
  if (!externo.id) throw new Error('El proveedor no devolvió un identificador de usuario.');
  let email = externo.email?.trim().toLowerCase() || null;
  const nombre = (externo.nombre || `Usuario ${providerId}`).trim().slice(0, 100);

  const [identidades] = await pool.query('SELECT usuario_id FROM identidades_oauth WHERE proveedor = ? AND proveedor_id = ?', [providerId, externo.id]);
  let usuarioId = identidades[0]?.usuario_id;

  if (!usuarioId && email && externo.emailVerificado) {
    const [usuarios] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    usuarioId = usuarios[0]?.id;
  }

  if (!usuarioId) {
    // Algunos proveedores, como X, no entregan email mediante su flujo OAuth.
    // En ese caso la identidad externa sigue siendo suficiente para entrar;
    // el email del perfil queda NULL y la cuenta se puede completar después.
    const [r] = await pool.query('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, NULL)', [nombre, email]);
    usuarioId = r.insertId;
  }

  await pool.query(
    `INSERT INTO identidades_oauth (usuario_id, proveedor, proveedor_id, email_proveedor, nombre_proveedor)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE email_proveedor = VALUES(email_proveedor), nombre_proveedor = VALUES(nombre_proveedor)`,
    [usuarioId, providerId, externo.id, email, nombre]
  );

  const [filas] = await pool.query('SELECT id, nombre, email, creado_en FROM usuarios WHERE id = ?', [usuarioId]);
  return filas[0];
}

export async function callbackOAuth(providerId, req, res) {
  limpiarMapas();
  const p = proveedores[providerId];
  const registro = estados.get(req.query.state);
  estados.delete(req.query.state);
  if (!p || !registro || registro.providerId !== providerId) return res.status(400).send('Solicitud OAuth inválida o vencida.');
  if (req.query.error) return res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent(req.query.error_description || req.query.error)}`);

  try {
    const redirectUri = callbackUri(providerId, p);
    const tokens = await intercambiarCodigo(p, req.query.code, redirectUri, registro.verifier);
    let externo = await obtenerUsuario(p, tokens.access_token);
    if (p.extra) externo = await p.extra(tokens.access_token, externo);
    const datos = p.map(externo);
    const usuario = await autenticarUsuario(providerId, datos);
    const codigo = aleatorio(32);
    intercambios.set(codigo, { token: firmarToken(usuario.id), expira: Date.now() + 2 * 60 * 1000 });
    res.redirect(`${FRONTEND_URL}/oauth/callback?code=${codigo}`);
  } catch (err) {
    console.error(`[OAuth:${providerId}]`, err.message);
    res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent(err.message || 'No se pudo iniciar sesión')}`);
  }
}

export function intercambiar(codigo) {
  limpiarMapas();
  const item = intercambios.get(codigo);
  if (!item) return null;
  intercambios.delete(codigo);
  return item.token;
}
