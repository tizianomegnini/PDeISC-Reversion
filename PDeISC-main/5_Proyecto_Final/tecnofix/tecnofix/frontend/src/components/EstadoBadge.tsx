import { ESTADOS } from '../utils';
import type { EstadoConsulta } from '../types';

export default function EstadoBadge({ estado }: { estado: EstadoConsulta }) {
  return <span className={`badge estado-${estado}`}>{ESTADOS[estado] || estado}</span>;
}
