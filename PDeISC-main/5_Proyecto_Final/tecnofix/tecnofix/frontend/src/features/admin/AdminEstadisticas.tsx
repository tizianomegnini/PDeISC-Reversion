import { adminApi } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import Loading from '../../components/Loading';
import ErrorBox from '../../components/ErrorBox';
import Stars from '../../components/Stars';
import { fecha, nombreCompleto, promedio } from '../../utils';
import StatisticsCharts from './StatisticsCharts';

/**
 * Dashboard de métricas administrativas con KPIs, tablas por local y técnico, y valoraciones recientes.
 */
export default function AdminEstadisticas() {
  const est = useFetch(() => adminApi.estadisticas());
  const val = useFetch(() => adminApi.valoraciones());
  const resumen = useFetch(() => adminApi.resumen());
  const totalTecnicos = est.data?.tecnicos.filter((tecnico) => !tecnico.deleted_at).length ?? 0;
  const tecnicosActivos = est.data?.tecnicos.filter((tecnico) => !tecnico.deleted_at && tecnico.activo && tecnico.habilitado).length ?? 0;
  const totalLocales = est.data?.locales.length ?? 0;
  const promedioGeneral = resumen.data?.resumen.promedio_general;
  const consultasTotal = resumen.data?.resumen.consultas_total ?? 0;
  const consultasPendientes = resumen.data?.resumen.pendientes ?? 0;
  const consultasActivas = resumen.data?.resumen.activas ?? 0;
  const consultasFinalizadas = resumen.data?.resumen.finalizadas ?? 0;
  const totalValoraciones = resumen.data?.resumen.valoraciones_total ?? 0;
  return (
    <>
      <header className="stats-page-header">
        <div><span className="stats-eyebrow">CENTRO DE CONTROL</span><h1>Estadísticas</h1><p>Una vista general del trabajo y la experiencia en TecnoFix.</p></div>
      </header>
      <ErrorBox error={est.error || val.error || resumen.error} onRetry={() => { est.reload(); val.reload(); resumen.reload(); }} />
      {est.loading || val.loading || resumen.loading ? <Loading /> : est.data && val.data && resumen.data && (<>
        <section className="stats-kpis" aria-label="Indicadores principales">
          <article className="stats-kpi"><span>Consultas registradas</span><strong>{consultasTotal}</strong><small>{consultasPendientes} pendientes</small></article>
          <article className="stats-kpi"><span>En atención</span><strong>{consultasActivas}</strong><small>Consultas activas</small></article>
          <article className="stats-kpi"><span>Finalizadas</span><strong>{consultasFinalizadas}</strong><small>Consultas atendidas</small></article>
          <article className="stats-kpi"><span>Valoración general</span><strong>{promedioGeneral == null ? '—' : `${Number(promedioGeneral).toFixed(2)} ★`}</strong><small>{totalValoraciones} valoraciones</small></article>
          <article className="stats-kpi"><span>Técnicos disponibles</span><strong>{tecnicosActivos}<small className="stats-kpi-total"> / {totalTecnicos}</small></strong><small>En {totalLocales} locales</small></article>
        </section>
        <StatisticsCharts
          summary={resumen.data.resumen}
          statistics={est.data}
          ratings={val.data.valoraciones}
        />
        <h2>Por local</h2>
        <div className="table-responsive rounded border bg-body mb-3"><table className="table table-striped table-hover align-middle mb-0">
          <thead><tr><th>Local</th><th>Técnicos</th><th>Activas</th><th>Atendidas</th><th>Valoración</th></tr></thead>
          <tbody>{est.data.locales.map((l) => <tr key={l.id}><td>{l.nombre}{!l.activo && ' (inactivo)'}</td><td>{l.tecnicos}</td><td>{l.activas}</td><td>{l.atendidas}</td><td>{promedio(l.promedio)}</td></tr>)}</tbody>
        </table></div>
        <h2>Por técnico</h2>
        <div className="table-responsive rounded border bg-body mb-3"><table className="table table-striped table-hover align-middle mb-0">
          <thead><tr><th>Técnico</th><th>Local</th><th>Activas / límite</th><th>Atendidas</th><th>Valoración</th><th>Puntaje de asignación</th></tr></thead>
          <tbody>{est.data.tecnicos.filter((t) => !t.deleted_at).map((t) => (
            <tr key={t.id}><td>{t.nombre} {t.apellido}</td><td>{t.local_nombre}</td><td>{t.activas} / {t.limite_consultas}</td><td>{t.atendidas}</td>
              <td>{promedio(t.promedio)} <small className="muted">({t.cantidad_valoraciones})</small></td><td>{t.puntaje_asignacion}</td></tr>))}
          </tbody>
        </table></div>
        <p className="muted">La asignación prioriza el menor puntaje ponderado para distribuir oportunidades y ayudar a que los técnicos sumen valoraciones. Quien todavía no tiene valoraciones parte de 4.0; los empates se resuelven por menor cantidad de consultas activas.</p>
      </>)}
      <h2>Valoraciones recientes</h2>
      {val.loading ? <Loading /> : val.data && (val.data.valoraciones.length === 0 ? <p className="muted">Todavía no hay valoraciones.</p> : (
        <div className="table-responsive rounded border bg-body mb-3"><table className="table table-striped table-hover align-middle mb-0">
          <thead><tr><th>Fecha</th><th>Consulta</th><th>Técnico</th><th>Local</th><th>Cliente</th><th>Estrellas</th><th>Comentario</th></tr></thead>
          <tbody>{val.data.valoraciones.map((v) => (
            <tr key={v.id}><td>{fecha(v.created_at)}</td><td>#{v.consulta_id}</td><td>{nombreCompleto(v.tecnico_nombre, v.tecnico_apellido)}</td><td>{v.local_nombre}</td>
              <td>{nombreCompleto(v.cliente_nombre, v.cliente_apellido)}</td><td><Stars value={v.estrellas} size="1rem" /></td><td>{v.comentario || '—'}</td></tr>))}
          </tbody>
        </table></div>
      ))}
    </>
  );
}
