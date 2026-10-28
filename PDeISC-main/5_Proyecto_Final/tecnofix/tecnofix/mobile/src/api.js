import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://pdeisc-production-182f.up.railway.app/api/v1').replace(/\/+$/, '');
const TOKEN_KEY = 'tecnofix-session-token';
let token = null;

export function getOAuthRedirectUri() {
  return Linking.createURL('oauth');
}

export async function restoreToken() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}

export async function saveToken(value) {
  token = value;
  if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'tecnofix',
        'X-Client': 'mobile',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('No se pudo conectar con TecnoFix. Revisá tu conexión e intentá de nuevo.', 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || `Error ${response.status}`, response.status);
  return data;
}

const get = (path) => request('GET', path);
const post = (path, body = {}) => request('POST', path, body);
const put = (path, body) => request('PUT', path, body);
const patch = (path, body) => request('PATCH', path, body);
const del = (path) => request('DELETE', path);

export const authApi = {
  me: () => get('/auth/me'),
  login: (data) => post('/auth/login', data),
  register: (data) => post('/auth/register', data),
  exchangeMobileCode: (code) => post('/auth/social/mobile/exchange', { code }),
  socialLoginUrl: (provider, redirectUri) => (
    `${API_URL}/auth/social/${provider}/mobile?redirect_uri=${encodeURIComponent(redirectUri)}`
  ),
  updateProfile: (data) => put('/auth/me', data),
  changePassword: (data) => post('/auth/change-password', data),
};

export const consultasApi = {
  list: (estado) => get(`/consultas${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`),
  get: (id) => get(`/consultas/${id}`),
  create: (data) => post('/consultas', data),
  setEstado: (id, estado) => patch(`/consultas/${id}/estado`, { estado }),
  mensajes: (id) => get(`/consultas/${id}/mensajes`),
  enviarMensaje: (id, contenido) => post(`/consultas/${id}/mensajes`, { contenido }),
  valorar: (id, estrellas, comentario) => post(`/consultas/${id}/valoracion`, { estrellas, comentario }),
};

export const tecnicoApi = {
  resumen: () => get('/tecnico/resumen'),
};

export const adminApi = {
  resumen: () => get('/admin/resumen'),
  estadisticas: () => get('/admin/estadisticas'),
  tecnicos: () => get('/admin/tecnicos'),
  crearTecnico: (data) => post('/admin/tecnicos', data),
  editarTecnico: (id, data) => put(`/admin/tecnicos/${id}`, data),
  restablecerPasswordTecnico: (id, password) => put(`/admin/tecnicos/${id}/password`, { password }),
  estadoTecnico: (id, activo) => post(`/admin/tecnicos/${id}/estado`, { activo }),
  eliminarTecnico: (id) => del(`/admin/tecnicos/${id}`),
  locales: () => get('/admin/locales'),
  crearLocal: (data) => post('/admin/locales', data),
  editarLocal: (id, data) => put(`/admin/locales/${id}`, data),
  eliminarLocal: (id) => del(`/admin/locales/${id}`),
  pendientes: () => get('/admin/consultas/pendientes'),
  asignar: (id) => post(`/admin/consultas/${id}/asignar`),
  reintentar: () => post('/admin/consultas/reintentar'),
  valoraciones: () => get('/admin/valoraciones'),
  config: () => get('/admin/configuracion'),
  guardarConfig: (data) => put('/admin/configuracion', data),
};
