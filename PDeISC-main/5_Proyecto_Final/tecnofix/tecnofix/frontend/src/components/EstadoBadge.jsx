import { ESTADOS } from '../utils.js';

export default function EstadoBadge({ estado }) {
  return <span className={`badge estado-${estado}`}>{ESTADOS[estado] || estado}</span>;
}
