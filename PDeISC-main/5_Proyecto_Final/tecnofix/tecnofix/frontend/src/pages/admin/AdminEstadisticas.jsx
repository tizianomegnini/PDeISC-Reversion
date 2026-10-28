import { adminApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Loading from '../../components/Loading.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';
import Stars from '../../components/Stars.jsx';
import { fecha, nombreCompleto, promedio } from '../../utils.js';

export default function AdminEstadisticas() {
  const est = useFetch(() => adminApi.estadisticas());
  const val = useFetch(() => adminApi.valoraciones());
  return (
    <>
      <h1>Estadísticas</h1>
      <ErrorBox error={est.error || val.error} onRetry={() => { est.reload(); val.reload(); }} />
      {est.loading ? <Loading /> : est.data && (<>
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
