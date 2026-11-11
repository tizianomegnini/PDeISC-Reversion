import type {
  EstadisticasAdmin,
  Local,
  Mensaje,
  RespuestaConsulta,
  RespuestaConsultas,
  RespuestaUsuario,
  ResumenAdmin,
  ResumenTecnico,
  Tecnico,
  Usuario,
  Valoracion,
} from '../types';

// Única puerta de entrada a los datos: el frontend NUNCA habla con MySQL, solo con esta API.
// Una app móvil (Expo) reutiliza la misma API con "Authorization: ******" y el header "X-Client: mobile".
/**
 * Base URL compartida por todas las llamadas del frontend con cookies de sesión incluidas.
 */
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Error de red o de backend con código HTTP y payload opcional de detalle.
 */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly detalles?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorResponse {
  error?: unknown;
  detalles?: unknown;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'tecnofix' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. ¿Está iniciado el backend (npm run dev)?', 0);
  }
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorData = data as ApiErrorResponse;
    const message = typeof errorData.error === 'string' ? errorData.error : `Error ${res.status}`;
    throw new ApiError(message, res.status, errorData.detalles);
  }
  return data as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body: unknown = {}) => request<T>('POST', path, body);
const put = <T>(path: string, body: unknown) => request<T>('PUT', path, body);
const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

export const authApi = {
  me: () => get<RespuestaUsuario>('/auth/me'),
  login: (data: { email: string; password: string }) => post<RespuestaUsuario>('/auth/login', data),
  register: (data: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    password: string;
  }) => post<RespuestaUsuario>('/auth/register', data),
  logout: () => post<Record<string, never>>('/auth/logout'),
  updateProfile: (data: { nombre: string; apellido: string; telefono: string | null }) =>
    put<RespuestaUsuario>('/auth/me', data),
  changePassword: (data: { actual: string; nueva: string }) =>
    post<RespuestaUsuario>('/auth/change-password', data),
  socialStart: async (proveedor: string): Promise<void> => {
    if (!['google', 'facebook', 'github'].includes(proveedor)) {
      await get<unknown>(`/auth/social/${proveedor}`);
      return;
    }
    const { proveedores } = await get<{ proveedores: Array<{ proveedor: string; configurado: boolean }> }>('/auth/social');
    if (!proveedores.find((item) => item.proveedor === proveedor && item.configurado)) {
      const nombre = { google: 'Google', facebook: 'Facebook', github: 'GitHub' }[proveedor];
      throw new ApiError(`El inicio de sesión con ${nombre} todavía no está configurado.`, 501);
    }
    window.location.assign(`${BASE}/auth/social/${proveedor}`);
  },
};

export const consultasApi = {
  list: (estado?: string) =>
    get<RespuestaConsultas>(`/consultas${estado ? `?estado=${estado}` : ''}`),
  get: (id: string | undefined) => get<RespuestaConsulta>(`/consultas/${id}`),
  create: (data: { tipo_equipo: string; marca: string; modelo: string; descripcion: string }) =>
    post<RespuestaConsulta>('/consultas', data),
  setEstado: (id: number, estado: string) =>
    patch<Record<string, never>>(`/consultas/${id}/estado`, { estado }),
  mensajes: (id: number) => get<{ mensajes: Mensaje[] }>(`/consultas/${id}/mensajes`),
  enviarMensaje: (id: number, contenido: string) =>
    post<Record<string, never>>(`/consultas/${id}/mensajes`, { contenido }),
  valorar: (id: number, estrellas: number, comentario: string | null) =>
    post<Record<string, never>>(`/consultas/${id}/valoracion`, { estrellas, comentario }),
};

export const tecnicoApi = {
  resumen: () => get<ResumenTecnico>('/tecnico/resumen'),
};

export const adminApi = {
  resumen: () => get<ResumenAdmin>('/admin/resumen'),
  estadisticas: () => get<EstadisticasAdmin>('/admin/estadisticas'),
  valoraciones: () => get<{ valoraciones: Valoracion[] }>('/admin/valoraciones'),
  tecnicos: () => get<{ tecnicos: Tecnico[] }>('/admin/tecnicos'),
  crearTecnico: (data: Record<string, string | number | null>) =>
    post<{ password_temporal: string }>('/admin/tecnicos', data),
  editarTecnico: (id: number, data: Record<string, string | number | null>) =>
    put<Record<string, never>>(`/admin/tecnicos/${id}`, data),
  restablecerPasswordTecnico: (id: number, password: string) =>
    put<Record<string, never>>(`/admin/tecnicos/${id}/password`, { password }),
  estadoTecnico: (id: number, activo: boolean) =>
    post<Record<string, never>>(`/admin/tecnicos/${id}/estado`, { activo }),
  eliminarTecnico: (id: number) => del<Record<string, never>>(`/admin/tecnicos/${id}`),
  locales: () => get<{ locales: Local[] }>('/admin/locales'),
  crearLocal: (data: Omit<Local, 'id' | 'activo' | 'tecnicos' | 'activas' | 'atendidas'> & { telefono: string | null }) =>
    post<Record<string, never>>('/admin/locales', data),
  editarLocal: (id: number, data: Partial<Local>) =>
    put<Record<string, never>>(`/admin/locales/${id}`, data),
  eliminarLocal: (id: number) => del<Record<string, never>>(`/admin/locales/${id}`),
  pendientes: () => get<RespuestaConsultas>('/admin/consultas/pendientes'),
  asignar: (id: number) => post<{ asignada: boolean }>(`/admin/consultas/${id}/asignar`),
  reintentar: () => post<{ pendientes: number; asignadas: number }>('/admin/consultas/reintentar'),
  config: () => get<{ limite_consultas_default: number }>('/admin/configuracion'),
  guardarConfig: (data: { limite_consultas_default: number }) =>
    put<Record<string, never>>('/admin/configuracion', data),
};

/**
 * Normaliza errores de fetch para mostrar mensajes claros al usuario final.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export type { Usuario };
