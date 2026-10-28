export const ESTADOS = {
  pendiente: 'Pendiente de asignación',
  asignada: 'Asignada',
  en_proceso: 'En proceso',
  esperando_cliente: 'Esperando al cliente',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};
export const fecha = (d) => (d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
export const nombreCompleto = (n, a) => [n, a].filter(Boolean).join(' ') || '—';
export const promedio = (v) => (v === null || v === undefined ? 'Sin valoraciones' : `${Number(v).toFixed(2)} ★`);
export const equipo = ({ tipo_equipo, marca, modelo }) => {
  const tipo = tipo_equipo === 'No identificado' ? '' : tipo_equipo;
  const detalle = [marca, modelo].filter((dato) => dato && dato !== 'No identificado').join(' ');
  if (!tipo && !detalle) return 'Equipo no identificado';
  return [tipo, detalle].filter(Boolean).join(tipo && detalle ? ' — ' : '');
};
