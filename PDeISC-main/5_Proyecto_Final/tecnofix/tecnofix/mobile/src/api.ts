import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import type {
  AdminSummary,
  AuthForm,
  AuthResponse,
  ChatMessage,
  Consultation,
  ConsultationForm,
  ConsultationStatus,
  Location,
  LocationForm,
  LocationUpdate,
  Review,
  StatisticsResponse,
  Technician,
  TechnicianForm,
  TechnicianSummary,
  TechnicianUpdate,
  User,
} from './types';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://pdeisc-production-182f.up.railway.app/api/v1').replace(/\/+$/, '');
const TOKEN_KEY = 'tecnofix-session-token';
let token: string | null = null;

export function getOAuthRedirectUri(): string {
  return Linking.createURL('oauth');
}

export async function restoreToken(): Promise<string | null> {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}

export async function saveToken(value: string | null): Promise<void> {
  token = value;
  if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
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
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
      ? data.error
      : `Error ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return data as T;
}

const get = <T>(path: string): Promise<T> => request<T>('GET', path);
const post = <T>(path: string, body: unknown = {}): Promise<T> => request<T>('POST', path, body);
const put = <T>(path: string, body: unknown): Promise<T> => request<T>('PUT', path, body);
const patch = <T>(path: string, body: unknown): Promise<T> => request<T>('PATCH', path, body);
const del = <T>(path: string, body?: unknown): Promise<T> => request<T>('DELETE', path, body);

interface ApiMessage {
  message?: string;
}

export const authApi = {
  me: () => get<{ usuario: User }>('/auth/me'),
  login: (data: AuthForm) => post<AuthResponse>('/auth/login', data),
  register: (data: AuthForm) => post<AuthResponse>('/auth/register', data),
  exchangeMobileCode: (code: string) => post<AuthResponse>('/auth/social/mobile/exchange', { code }),
  socialLoginUrl: (provider: string, redirectUri: string): string => (
    `${API_URL}/auth/social/${provider}/mobile?redirect_uri=${encodeURIComponent(redirectUri)}`
  ),
  updateProfile: (data: Pick<User, 'nombre' | 'apellido' | 'telefono'>) => put<{ usuario: User }>('/auth/me', data),
  changePassword: (data: { actual: string; nueva: string }) => post<ApiMessage>('/auth/change-password', data),
};

export const notificationsApi = {
  registerDevice: (pushToken: string, plataforma: string) => post<ApiMessage>('/notificaciones/dispositivo', { token: pushToken, plataforma }),
  unregisterDevice: (pushToken: string) => del<ApiMessage>('/notificaciones/dispositivo', { token: pushToken }),
};

export const consultasApi = {
  list: (estado?: ConsultationStatus) => get<{ consultas: Consultation[] }>(`/consultas${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`),
  get: (id: number) => get<{ consulta: Consultation }>(`/consultas/${id}`),
  create: (data: ConsultationForm) => post<{ consulta: Consultation }>('/consultas', data),
  setEstado: (id: number, estado: ConsultationStatus) => patch<ApiMessage>(`/consultas/${id}/estado`, { estado }),
  mensajes: (id: number) => get<{ mensajes: ChatMessage[] }>(`/consultas/${id}/mensajes`),
  enviarMensaje: (id: number, contenido: string) => post<ApiMessage>(`/consultas/${id}/mensajes`, { contenido }),
  valorar: (id: number, estrellas: number, comentario: string | null) => post<ApiMessage>(`/consultas/${id}/valoracion`, { estrellas, comentario }),
};

export const tecnicoApi = {
  resumen: () => get<TechnicianSummary>('/tecnico/resumen'),
};

export const adminApi = {
  resumen: () => get<{ resumen: AdminSummary }>('/admin/resumen'),
  estadisticas: () => get<StatisticsResponse>('/admin/estadisticas'),
  tecnicos: () => get<{ tecnicos: Technician[] }>('/admin/tecnicos'),
  crearTecnico: (data: TechnicianForm) => post<{ password_temporal?: string }>('/admin/tecnicos', data),
  editarTecnico: (id: number, data: TechnicianUpdate) => put<ApiMessage>(`/admin/tecnicos/${id}`, data),
  restablecerPasswordTecnico: (id: number, password: string) => put<ApiMessage>(`/admin/tecnicos/${id}/password`, { password }),
  estadoTecnico: (id: number, activo: boolean) => post<ApiMessage>(`/admin/tecnicos/${id}/estado`, { activo }),
  eliminarTecnico: (id: number) => del<ApiMessage>(`/admin/tecnicos/${id}`),
  locales: () => get<{ locales: Location[] }>('/admin/locales'),
  crearLocal: (data: LocationForm) => post<ApiMessage>('/admin/locales', data),
  editarLocal: (id: number, data: LocationUpdate) => put<ApiMessage>(`/admin/locales/${id}`, data),
  eliminarLocal: (id: number) => del<ApiMessage>(`/admin/locales/${id}`),
  pendientes: () => get<{ consultas: Consultation[] }>('/admin/consultas/pendientes'),
  asignar: (id: number) => post<ApiMessage>(`/admin/consultas/${id}/asignar`),
  reintentar: () => post<ApiMessage>('/admin/consultas/reintentar'),
  valoraciones: () => get<{ valoraciones: Review[] }>('/admin/valoraciones'),
  config: () => get<{ limite_consultas_default: number | string }>('/admin/configuracion'),
  guardarConfig: (data: { limite_consultas_default: number }) => put<{ limite_consultas_default: number | string }>('/admin/configuracion', data),
};
