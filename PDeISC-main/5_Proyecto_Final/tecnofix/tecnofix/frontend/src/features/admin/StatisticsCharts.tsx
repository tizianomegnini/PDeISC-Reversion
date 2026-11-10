import type { EstadisticasAdmin, ResumenAdmin, Valoracion } from '../../types';

const chartColors = {
  pending: 'var(--warn)',
  active: 'var(--primary)',
  completed: 'var(--ok)',
  other: 'var(--muted)',
};

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function ConsultationDonut({ summary }: { summary: ResumenAdmin['resumen'] }) {
  const totalConsultations = summary.consultas_total ?? 0;
  const pending = summary.pendientes ?? 0;
  const active = summary.activas ?? 0;
  const completed = summary.finalizadas ?? 0;
  const cancelledOrOther = Math.max(
    0,
    totalConsultations - pending - active - completed,
  );
  const segments: DonutSegment[] = [
    { label: 'Pendientes', value: pending, color: chartColors.pending },
    { label: 'Activas', value: active, color: chartColors.active },
    { label: 'Finalizadas', value: completed, color: chartColors.completed },
    { label: 'Canceladas u otras', value: cancelledOrOther, color: chartColors.other },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const circumference = 2 * Math.PI * 42;
  let offset = 0;

  return (
    <div className="stats-donut-layout">
      <div className="stats-donut">
        <svg viewBox="0 0 100 100" role="img" aria-label="Distribución de consultas por estado">
          <circle className="stats-donut-track" cx="50" cy="50" r="42" />
          {total > 0 && segments.filter((segment) => segment.value > 0).map((segment) => {
            const length = (segment.value / total) * circumference;
            const circle = (
              <circle
                key={segment.label}
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
            offset += length;
            return circle;
          })}
        </svg>
        <div className="stats-donut-center">
          <strong>{totalConsultations}</strong>
          <span>consultas</span>
        </div>
      </div>
      <ul className="stats-legend">
        {segments.map((segment) => (
          <li key={segment.label}>
            <span className="stats-legend-dot" style={{ backgroundColor: segment.color }} />
            <span>{segment.label}</span>
            <strong>{segment.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface WorkloadRow {
  id: number;
  label: string;
  active: number;
  completed: number;
}

function WorkloadBars({ rows, emptyMessage }: { rows: WorkloadRow[]; emptyMessage: string }) {
  const max = Math.max(1, ...rows.map((row) => row.active + row.completed));

  if (!rows.length) return <p className="muted mb-0">{emptyMessage}</p>;

  return (
    <div className="stats-bars">
      {rows.map((row) => {
        const total = row.active + row.completed;
        const activeWidth = total ? (row.active / max) * 100 : 0;
        const completedWidth = total ? (row.completed / max) * 100 : 0;
        return (
          <div className="stats-bar-row" key={row.id}>
            <div className="stats-bar-heading">
              <span title={row.label}>{row.label}</span>
              <strong>{total}</strong>
            </div>
            <div
              className="stats-bar-track"
              role="img"
              aria-label={`${row.label}: ${row.active} activas y ${row.completed} atendidas`}
            >
              <span className="stats-bar-active" style={{ width: `${activeWidth}%` }} />
              <span className="stats-bar-completed" style={{ width: `${completedWidth}%` }} />
            </div>
            <div className="stats-bar-caption">
              <span>{row.active} activas</span>
              <span>{row.completed} atendidas</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatingBars({ ratings }: { ratings: Valoracion[] }) {
  const counts = [1, 2, 3, 4, 5].map((stars) => ratings.filter((rating) => rating.estrellas === stars).length);
  const max = Math.max(1, ...counts);

  if (!ratings.length) return <p className="muted mb-0">Todavía no hay valoraciones para mostrar.</p>;

  return (
    <div className="stats-rating-chart" role="img" aria-label="Cantidad de valoraciones por cantidad de estrellas">
      {counts.map((count, index) => (
        <div className="stats-rating-column" key={index + 1}>
          <strong>{count}</strong>
          <div className="stats-rating-track">
            <span style={{ height: `${(count / max) * 100}%` }} />
          </div>
          <span>{index + 1} ★</span>
        </div>
      ))}
    </div>
  );
}

export default function StatisticsCharts({
  summary,
  statistics,
  ratings,
}: {
  summary: ResumenAdmin['resumen'];
  statistics: EstadisticasAdmin;
  ratings: Valoracion[];
}) {
  const localRows = statistics.locales
    .map((local) => ({ id: local.id, label: local.nombre, active: local.activas, completed: local.atendidas }))
    .sort((a, b) => b.active + b.completed - (a.active + a.completed));
  const technicianRows = statistics.tecnicos
    .filter((technician) => !technician.deleted_at)
    .map((technician) => ({
      id: technician.id,
      label: `${technician.nombre} ${technician.apellido}`,
      active: technician.activas,
      completed: technician.atendidas,
    }))
    .sort((a, b) => b.active + b.completed - (a.active + a.completed))
    .slice(0, 8);

  return (
    <section className="stats-dashboard" aria-label="Gráficos de estadísticas">
      <article className="stats-panel">
        <div className="stats-panel-heading">
          <div><span className="stats-eyebrow">VOLUMEN</span><h2>Consultas por estado</h2></div>
        </div>
        <ConsultationDonut summary={summary} />
      </article>
      <article className="stats-panel">
        <div className="stats-panel-heading">
          <div><span className="stats-eyebrow">OPERACIÓN</span><h2>Actividad por local</h2></div>
          <div className="stats-chart-legend">
            <span><i className="stats-bar-active" /> Activas</span>
            <span><i className="stats-bar-completed" /> Atendidas</span>
          </div>
        </div>
        <WorkloadBars rows={localRows} emptyMessage="Todavía no hay locales para comparar." />
      </article>
      <article className="stats-panel">
        <div className="stats-panel-heading">
          <div><span className="stats-eyebrow">EQUIPO</span><h2>Actividad por técnico</h2></div>
          <div className="stats-chart-legend">
            <span><i className="stats-bar-active" /> Activas</span>
            <span><i className="stats-bar-completed" /> Atendidas</span>
          </div>
        </div>
        <WorkloadBars rows={technicianRows} emptyMessage="Todavía no hay técnicos para comparar." />
        {statistics.tecnicos.filter((technician) => !technician.deleted_at).length > technicianRows.length && (
          <p className="stats-footnote">Se muestran los 8 técnicos con mayor actividad.</p>
        )}
      </article>
      <article className="stats-panel">
        <div className="stats-panel-heading">
          <div><span className="stats-eyebrow">EXPERIENCIA</span><h2>Distribución de valoraciones</h2></div>
          <span className="stats-sample">{ratings.length} recientes</span>
        </div>
        <RatingBars ratings={ratings} />
        <p className="stats-footnote">Distribución calculada sobre las últimas {ratings.length} valoraciones disponibles.</p>
      </article>
    </section>
  );
}
