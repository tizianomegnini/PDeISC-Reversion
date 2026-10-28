import { Link } from 'react-router-dom';
import EstadoBadge from './EstadoBadge.jsx';
import { equipo, fecha, nombreCompleto } from '../utils.js';

export default function ConsultasTable({ consultas, mostrarCliente = false, mostrarTecnico = true, children }) {
  if (!consultas.length) return <p className="muted">No hay consultas para mostrar.</p>;
  return (
    <div className="table-responsive rounded border bg-body mb-3">
      <table className="table table-striped table-hover align-middle mb-0">
        <thead><tr>
          <th>#</th><th>Equipo</th>{mostrarCliente && <th>Cliente</th>}{mostrarTecnico && <th>Técnico / Local</th>}<th>Estado</th><th>Creada</th><th />
        </tr></thead>
        <tbody>
          {consultas.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{equipo(c)}</td>
              {mostrarCliente && <td>{nombreCompleto(c.cliente_nombre, c.cliente_apellido)}</td>}
              {mostrarTecnico && <td>{c.tecnico_id ? `${nombreCompleto(c.tecnico_nombre, c.tecnico_apellido)} — ${c.local_nombre}` : '—'}</td>}
              <td><EstadoBadge estado={c.estado} /></td>
              <td>{fecha(c.created_at)}</td>
              <td className="actions"><Link to={`/consultas/${c.id}`}>Ver</Link>{children?.(c)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
