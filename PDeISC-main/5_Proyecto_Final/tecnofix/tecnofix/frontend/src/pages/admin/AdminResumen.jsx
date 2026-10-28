import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';

const ITEMS = [
  ['consultas_total', 'Consultas totales'], ['pendientes', 'Pendientes'], ['activas', 'Activas'], ['finalizadas', 'Finalizadas'],
  ['tecnicos_habilitados', 'Técnicos habilitados'], ['locales_activos', 'Locales activos'], ['valoraciones_total', 'Valoraciones'], ['promedio_general', 'Promedio general'],
];

export default function AdminResumen() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() => adminApi.resumen());
  const cfg = useFetch(() => adminApi.config());
  const [limite, setLimite] = useState('');
  useEffect(() => { if (cfg.data) setLimite(String(cfg.data.limite_consultas_default)); }, [cfg.data]);

  const guardar = async (e) => {
    e.preventDefault();
    try { await adminApi.guardarConfig({ limite_consultas_default: Number(limite) }); toast.ok('Límite por defecto actualizado (se aplica a técnicos nuevos)'); cfg.reload(true); }
    catch (err) { toast.error(err.message); }
  };
  return (
    <>
      <section className="role-hero role-hero--admin">
        <div>
          <span className="eyebrow">CENTRO DE CONTROL</span>
          <h1>Resumen de operaciones</h1>
          <p>Una vista general del servicio, los equipos y la red de atención. Usá el menú superior para revisar consultas pendientes, administrar técnicos y locales o consultar las estadísticas.</p>
        </div>
        <span className="admin-status"><span /> SISTEMA OPERATIVO</span>
      </section>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Loading /> : data && (
        <div className="grid role-stats role-stats--admin">{ITEMS.map(([k, label]) => <div key={k} className="stat"><b>{data.resumen[k] ?? '—'}</b><span>{label}</span></div>)}</div>
      )}
      <section className="card admin-config">
        <div><span className="eyebrow">CONFIGURACIÓN</span><h2>Límite de consultas por técnico</h2></div>
        <p className="muted">Valor por defecto para técnicos nuevos. El límite de cada técnico se edita individualmente en “Técnicos”.</p>
        <form onSubmit={guardar} className="row">
          <input type="number" min="1" max="1000" value={limite} onChange={(e) => setLimite(e.target.value)} required aria-label="Límite por defecto" style={{ maxWidth: 120 }} />
          <button>Guardar</button>
        </form>
      </section>
    </>
  );
}
