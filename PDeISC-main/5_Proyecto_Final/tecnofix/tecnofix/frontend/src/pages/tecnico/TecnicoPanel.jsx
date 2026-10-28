import { consultasApi, tecnicoApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Loading from '../../components/Loading.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';
import ConsultasTable from '../../components/ConsultasTable.jsx';
import Stars from '../../components/Stars.jsx';

export default function TecnicoPanel() {
  const resumen = useFetch(() => tecnicoApi.resumen());
  const lista = useFetch(() => consultasApi.list());
  const s = resumen.data?.stats; const t = resumen.data?.tecnico;
  const consultas = lista.data?.consultas || [];
  const activas = consultas.filter((consulta) => !['finalizada', 'cancelada'].includes(consulta.estado)).length;
  return (
    <>
      <section className="role-hero role-hero--tecnico">
        <div>
          <span className="eyebrow">PANEL TÉCNICO</span>
          <h1>Hola{t?.nombre ? `, ${t.nombre}` : ''}. ¿Qué atendemos hoy?</h1>
          <p>Administrá tus casos asignados, actualizá su progreso y acompañá cada reparación.</p>
        </div>
        {t?.local_nombre && <div className="hero-context"><span>LOCAL ASIGNADO</span><strong>{t.local_nombre}</strong></div>}
      </section>
      <ErrorBox error={resumen.error || lista.error} onRetry={() => { resumen.reload(); lista.reload(); }} />
      {resumen.loading ? <Loading /> : s && (
        <div className="grid role-stats role-stats--tecnico">
          <div className="stat"><b>{s.promedio === null ? '—' : s.promedio.toFixed(2)}</b><span>Valoración promedio {s.promedio !== null && <Stars value={Math.round(s.promedio)} size="1rem" />}</span></div>
          <div className="stat"><b>{s.cantidad_valoraciones}</b><span>Valoraciones recibidas</span></div>
          <div className="stat"><b>{s.atendidas}</b><span>Trabajos atendidos</span></div>
          <div className="stat"><b>{s.activas} / {t.limite_consultas}</b><span>Consultas activas / límite</span></div>
        </div>
      )}
      <div className="section-heading">
        <div><span className="eyebrow">TRABAJO EN CURSO</span><h2>Consultas asignadas <span className="count-pill">{activas}</span></h2><p className="muted section-hint">Abrí una consulta para leer el caso, responder mensajes y actualizar su estado.</p></div>
        <button className="btn btn-outline-secondary" onClick={() => { lista.reload(); resumen.reload(); }}>Actualizar</button>
      </div>
      {lista.loading ? <Loading /> : lista.data && <ConsultasTable consultas={lista.data.consultas} mostrarCliente mostrarTecnico={false} />}
    </>
  );
}
