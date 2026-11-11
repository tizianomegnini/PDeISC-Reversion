/**
 * Contratos de dominio usados por la UI: roles, consultas, usuarios, locales y valoraciones.
 * Se mantienen centrados para que los componentes no dependan de payloads ad hoc del backend.
 */
export type Rol = 'cliente' | 'tecnico' | 'admin';
export type EstadoConsulta =
  | 'pendiente'
  | 'asignada'
  | 'en_proceso'
  | 'esperando_cliente'
  | 'finalizada'
  | 'cancelada';

export interface Usuario {
  id: number;
  rol: Rol;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  debe_cambiar_password: boolean;
}

export interface Consulta {
  id: number;
  estado: EstadoConsulta;
  tipo_equipo: string | null;
  marca: string | null;
  modelo: string | null;
  descripcion: string;
  created_at: string;
  finalizada_at: string | null;
  tecnico_id: number | null;
  tecnico_nombre: string | null;
  tecnico_apellido: string | null;
  local_nombre: string | null;
  local_direccion?: string | null;
  local_ciudad?: string | null;
  cliente_nombre?: string | null;
  cliente_apellido?: string | null;
  cliente_email?: string | null;
  cliente_telefono?: string | null;
  valoracion_estrellas?: number | null;
  valoracion_comentario?: string | null;
}

export interface Mensaje {
  id: number;
  autor_id: number;
  autor_nombre: string;
  autor_apellido: string;
  created_at: string;
  contenido: string;
}

export interface Local {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string | null;
  activo: boolean;
  tecnicos: number;
  activas: number;
  atendidas: number;
}

export interface Tecnico {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  local_id: number;
  local_nombre: string;
  especialidad: string | null;
  limite_consultas: number;
  activas: number;
  atendidas: number;
  promedio: number | null;
  cantidad_valoraciones: number;
  puntaje_asignacion: number;
  activo: boolean;
  habilitado: boolean;
  deleted_at: string | null;
}

export interface Valoracion {
  id: number;
  consulta_id: number;
  tecnico_nombre: string;
  tecnico_apellido: string;
  local_nombre: string;
  cliente_nombre: string;
  cliente_apellido: string;
  estrellas: number;
  comentario: string | null;
  created_at: string;
}

export interface TecnicoStats {
  promedio: number | null;
  cantidad_valoraciones: number;
  atendidas: number;
  activas: number;
}

export interface ResumenTecnico {
  stats: TecnicoStats;
  tecnico: Tecnico;
}

export interface ResumenAdmin {
  resumen: Record<
    | 'consultas_total'
    | 'pendientes'
    | 'activas'
    | 'finalizadas'
    | 'tecnicos_habilitados'
    | 'locales_activos'
    | 'valoraciones_total'
    | 'promedio_general',
    number | null
  >;
}

export interface EstadisticasAdmin {
  locales: Array<Local & { promedio: number | null }>;
  tecnicos: Array<Tecnico & { promedio: number | null }>;
}

export interface RespuestaUsuario {
  usuario: Usuario;
}

export interface RespuestaConsultas {
  consultas: Consulta[];
}

export interface RespuestaConsulta {
  consulta: Consulta;
}
