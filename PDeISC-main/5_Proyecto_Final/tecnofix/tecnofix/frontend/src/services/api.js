// Única puerta de entrada a los datos: el frontend NUNCA habla con MySQL, solo con esta API.
// Una app móvil (Expo) reutiliza la misma API con "Authorization: Bearer <token>" y el header "X-Client: mobile".
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(message, status, detalles) { super(message); this.status = status; this.detalles = detalles; }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include', // cookie httpOnly de sesión
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'tecnofix' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. ¿Está iniciado el backend (npm run dev)?', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Error ${res.status}`, res.status, data.detalles);
  return data;
}
const get = (p) => request('GET', p);
const post = (p, b = {}) => request('POST', p, b);
const put = (p, b) => request('PUT', p, b);
const patch = (p, b) => request('PATCH', p, b);
const del = (p) => request('DELETE', p);

export const authApi = {
  me: () => get('/auth/me'),
  login: (d) => post('/auth/login', d),
  register: (d) => post('/auth/register', d),
  logout: () => post('/auth/logout'),
  updateProfile: (d) => put('/auth/me', d),
  changePassword: (d) => post('/auth/change-password', d),
  socialStart: async (proveedor) => {
    if (!['google', 'facebook'].includes(proveedor)) return get(`/auth/social/${proveedor}`);
    const { proveedores } = await get('/auth/social');
    if (!proveedores.find((item) => item.proveedor === proveedor && item.configurado)) {
      throw new ApiError(`El inicio de sesión con ${proveedor === 'google' ? 'Google' : 'Facebook'} todavía no está configurado.`, 501);
    }
    window.location.assign(`${BASE}/auth/social/${proveedor}`);
  },
};
export const consultasApi = {
  list: (estado) => get(`/consultas${estado ? `?estado=${estado}` : ''}`),
  get: (id) => get(`/consultas/${id}`),
  create: (d) => post('/consultas', d),
  setEstado: (id, estado) => patch(`/consultas/${id}/estado`, { estado }),
  mensajes: (id) => get(`/consultas/${id}/mensajes`),
  enviarMensaje: (id, contenido) => post(`/consultas/${id}/mensajes`, { contenido }),
  valorar: (id, estrellas, comentario) => post(`/consultas/${id}/valoracion`, { estrellas, comentario }),
};
export const tecnicoApi = { resumen: () => get('/tecnico/resumen') };
export const adminApi = {
  resumen: () => get('/admin/resumen'),
  estadisticas: () => get('/admin/estadisticas'),
  valoraciones: () => get('/admin/valoraciones'),
  tecnicos: () => get('/admin/tecnicos'),
  crearTecnico: (d) => post('/admin/tecnicos', d),
  editarTecnico: (id, d) => put(`/admin/tecnicos/${id}`, d),
  restablecerPasswordTecnico: (id, password) => put(`/admin/tecnicos/${id}/password`, { password }),
  estadoTecnico: (id, activo) => post(`/admin/tecnicos/${id}/estado`, { activo }),
  eliminarTecnico: (id) => del(`/admin/tecnicos/${id}`),
  locales: () => get('/admin/locales'),
  crearLocal: (d) => post('/admin/locales', d),
  editarLocal: (id, d) => put(`/admin/locales/${id}`, d),
  eliminarLocal: (id) => del(`/admin/locales/${id}`),
  pendientes: () => get('/admin/consultas/pendientes'),
  asignar: (id) => post(`/admin/consultas/${id}/asignar`),
  reintentar: () => post('/admin/consultas/reintentar'),
  config: () => get('/admin/configuracion'),
  guardarConfig: (d) => put('/admin/configuracion', d),
};
