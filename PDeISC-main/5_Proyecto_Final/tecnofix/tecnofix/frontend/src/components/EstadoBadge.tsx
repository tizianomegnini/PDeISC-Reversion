import { ESTADOS } from '../utils';
import type { EstadoConsulta } from '../types';

/**
 * Badge visual para los distintos estados de consulta del negocio.
 */
export default function EstadoBadge({ estado }: { estado: EstadoConsulta }) {
  return <span className={`badge estado-${estado}`}>{ESTADOS[estado] || estado}</span>;
}
