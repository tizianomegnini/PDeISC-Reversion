import { Link } from 'react-router-dom';
import { consultasApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Loading from '../../components/Loading.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';
import ConsultasTable from '../../components/ConsultasTable.jsx';

export default function MisConsultas() {
  const { data, error, loading, reload } = useFetch(() => consultasApi.list());
  const consultas = data?.consultas || [];
  const activas = consultas.filter((consulta) => !['finalizada', 'cancelada'].includes(consulta.estado)).length;
  const finalizadas = consultas.filter((consulta) => consulta.estado === 'finalizada').length;
  return (
    <>
      <section className="role-hero role-hero--cliente">
        <div>
          <span className="eyebrow">ESPACIO CLIENTE</span>
          <h1>Tu soporte, en un solo lugar</h1>
          <p>Creá una consulta, seguí el estado de tu equipo y mantené el contacto con el técnico. Abrí cualquier caso para ver los mensajes y conocer qué hacer a continuación.</p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-outline-secondary" onClick={() => reload()}>Actualizar</button>
          <Link className="btn btn-primary" to="/consultas/nueva">+ Nueva consulta</Link>
        </div>
      </section>
      {!loading && data && (
        <div className="grid role-stats role-stats--cliente">
          <div className="stat"><span>Consultas registradas</span><b>{consultas.length}</b></div>
          <div className="stat"><span>En seguimiento</span><b>{activas}</b></div>
          <div className="stat"><span>Resueltas</span><b>{finalizadas}</b></div>
        </div>
      )}
      <div className="section-heading">
        <div><span className="eyebrow">SEGUIMIENTO</span><h2>Mis consultas</h2></div>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Loading /> : data && (data.consultas.length
        ? <ConsultasTable consultas={data.consultas} />
        : <section className="card empty-state">
          <span className="empty-icon" aria-hidden="true">⌕</span>
          <h3>Todavía no tenés consultas</h3>
          <p>Cuando necesites ayuda con un equipo, contanos qué está pasando. No hace falta que sepas el modelo.</p>
          <Link className="btn btn-primary" to="/consultas/nueva">Crear mi primera consulta</Link>
        </section>)}
    </>
  );
}
