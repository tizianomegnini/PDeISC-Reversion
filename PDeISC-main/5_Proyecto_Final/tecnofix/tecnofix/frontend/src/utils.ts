import type { EstadoConsulta } from './types';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

/**
 * Texto legible para cada estado de consulta, usado por badges y tablas.
 */
export const ESTADOS: Record<EstadoConsulta, string> = {
  pendiente: 'Pendiente de asignación',
  asignada: 'Asignada',
  en_proceso: 'En proceso',
  esperando_cliente: 'Esperando al cliente',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};
export const fecha = (d: string | null | undefined) => (d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
export const nombreCompleto = (n: string | null | undefined, a: string | null | undefined) => [n, a].filter(Boolean).join(' ') || '—';
export const promedio = (v: number | null | undefined) => (v === null || v === undefined ? 'Sin valoraciones' : `${Number(v).toFixed(2)} ★`);
/**
 * Resume la identidad del equipo para evitar repetir detalles técnicos en cada fila.
 * Ignora valores genéricos como 'No identificado' para mantener la UI ordenada.
 */
export const equipo = ({ tipo_equipo, marca, modelo }: { tipo_equipo: string | null; marca: string | null; modelo: string | null }) => {
  const tipo = tipo_equipo === 'No identificado' ? '' : tipo_equipo;
  const detalle = [marca, modelo].filter((dato) => dato && dato !== 'No identificado').join(' ');
  if (!tipo && !detalle) return 'Equipo no identificado';
  return [tipo, detalle].filter(Boolean).join(tipo && detalle ? ' — ' : '');
};

/**
 * Genera un setter reutilizable para inputs de formularios controlados.
 *
 * @param setForm Función de estado actual del formulario.
 * @returns Handler que actualiza un campo concreto sin reescribir lógica repetida.
 */
export function formFieldSetter<T extends object>(setForm: Dispatch<SetStateAction<T>>) {
  return (key: keyof T) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };
}
