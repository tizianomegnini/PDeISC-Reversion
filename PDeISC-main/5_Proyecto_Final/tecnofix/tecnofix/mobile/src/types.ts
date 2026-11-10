export type UserRole = 'cliente' | 'tecnico' | 'admin';
export type ThemeMode = 'light' | 'dark';
export type ConsultationStatus =
  | 'pendiente'
  | 'asignada'
  | 'en_proceso'
  | 'esperando_cliente'
  | 'finalizada'
  | 'cancelada';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  telefono?: string | null;
  debe_cambiar_password?: boolean;
}

export interface Consultation {
  id: number;
  estado: ConsultationStatus;
  tipo_equipo: string;
  marca?: string | null;
  modelo?: string | null;
  descripcion: string;
  created_at: string;
  finalizada_at?: string | null;
  tecnico_id?: number | null;
  tecnico_nombre?: string | null;
  tecnico_apellido?: string | null;
  cliente_nombre?: string | null;
  cliente_apellido?: string | null;
  cliente_email?: string | null;
  local_nombre?: string | null;
  local_direccion?: string | null;
  local_ciudad?: string | null;
  valoracion_estrellas?: number | null;
  valoracion_comentario?: string | null;
}

export interface ChatMessage {
  id: number;
  autor_id: number;
  autor_nombre: string;
  autor_apellido: string;
  contenido: string;
  created_at: string;
}

export interface Technician {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  local_id: number;
  local_nombre: string;
  especialidad?: string | null;
  limite_consultas: number;
  habilitado: boolean;
  activo: boolean;
  activas: number;
  atendidas: number;
  promedio?: number | null;
  deleted_at?: string | null;
}

export interface Location {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono?: string | null;
  activo: boolean;
  tecnicos: number;
  activas: number;
  atendidas: number;
}

export interface AuthResponse {
  token?: string;
  usuario: User;
}

export interface AuthForm {
  nombre?: string;
  apellido?: string;
  email: string;
  telefono?: string;
  password: string;
}

export interface ConsultationForm {
  tipo_equipo: string;
  marca: string;
  modelo: string;
  descripcion: string;
}

export interface TechnicianForm {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  local_id: number;
  especialidad: string | null;
  limite_consultas: number;
}

export interface TechnicianUpdate extends Omit<TechnicianForm, 'email'> {
  habilitado: boolean;
}

export interface LocationForm {
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string | null;
}

export interface LocationUpdate extends LocationForm {
  activo: boolean;
}

export interface AdminSummary {
  consultas_total: number | string;
  pendientes?: number | string;
  activas?: number | string;
  finalizadas?: number | string;
  tecnicos_habilitados?: number | string;
  locales_activos?: number | string;
  valoraciones_total?: number | string;
  promedio_general?: number | string | null;
}

export interface TechnicianSummary {
  tecnico: {
    local_nombre: string;
    especialidad?: string | null;
  };
  stats?: {
    activas?: number;
    atendidas?: number;
  };
}

export interface StatisticsResponse {
  tecnicos: Array<Pick<Technician, 'id' | 'nombre' | 'apellido' | 'local_nombre' | 'activas' | 'atendidas' | 'promedio' | 'deleted_at'>>;
  locales: Array<Pick<Location, 'id' | 'nombre' | 'tecnicos' | 'activas' | 'atendidas'> & { promedio?: number | null }>;
}

export interface Review {
  id: number;
  estrellas: number;
  consulta_id: number;
  cliente_nombre: string;
  cliente_apellido: string;
  tecnico_nombre: string;
  tecnico_apellido: string;
  local_nombre: string;
  comentario?: string | null;
  created_at: string;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
