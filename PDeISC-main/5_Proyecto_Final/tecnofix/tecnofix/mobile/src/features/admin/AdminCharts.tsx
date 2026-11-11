import { Text, View } from 'react-native';
import { Card, colors, styles } from '../../ui';
import type { AdminSummary, Review, StatisticsResponse } from '../../types';

function count(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={chartStyles.legendItem}>
      <View style={[chartStyles.legendDot, { backgroundColor: color }]} />
      <Text style={chartStyles.legendLabel}>{label}</Text>
      <Text style={chartStyles.legendValue}>{value}</Text>
    </View>
  );
}

function Metric({ label, value, caption, color }: { label: string; value: string | number; caption: string; color: string }) {
  return (
    <View style={chartStyles.metric}>
      <View style={[chartStyles.metricAccent, { backgroundColor: color }]} />
      <Text style={chartStyles.metricLabel}>{label}</Text>
      <Text style={chartStyles.metricValue}>{value}</Text>
      <Text style={chartStyles.metricCaption}>{caption}</Text>
    </View>
  );
}

function StatusChart({ summary }: { summary: AdminSummary }) {
  const total = count(summary.consultas_total);
  const pending = count(summary.pendientes);
  const active = count(summary.activas);
  const completed = count(summary.finalizadas);
  const other = Math.max(0, total - pending - active - completed);
  const segments = [
    { label: 'Pendientes', value: pending, color: colors.amber },
    { label: 'Activas', value: active, color: colors.primary },
    { label: 'Finalizadas', value: completed, color: colors.green },
    { label: 'Canceladas u otras', value: other, color: colors.muted },
  ];

  return (
    <Card>
      <View style={chartStyles.cardHeading}>
        <Text style={styles.adminSectionTitle}>Consultas por estado</Text>
        <Text style={chartStyles.cardCaption}>{total} en total</Text>
      </View>
      <View
        accessibilityRole="image"
        accessibilityLabel={`Distribución de ${total} consultas por estado`}
        style={chartStyles.stackedBar}
      >
        {segments.filter((segment) => segment.value > 0).map((segment) => (
          <View
            key={segment.label}
            style={{
              width: `${(segment.value / (total || 1)) * 100}%`,
              height: '100%',
              backgroundColor: segment.color,
            }}
          />
        ))}
        {!total && <View style={[chartStyles.emptyBar, { flex: 1 }]} />}
      </View>
      <View style={chartStyles.legendGrid}>
        {segments.map((segment) => (
          <LegendItem key={segment.label} {...segment} />
        ))}
      </View>
    </Card>
  );
}

interface WorkloadItem {
  id: number;
  name: string;
  active: number;
  completed: number;
}

function WorkloadChart({ title, items, emptyText }: { title: string; items: WorkloadItem[]; emptyText: string }) {
  const max = Math.max(1, ...items.map((item) => item.active + item.completed));
  return (
    <Card>
      <View style={chartStyles.cardHeading}>
        <Text style={styles.adminSectionTitle}>{title}</Text>
        <View style={chartStyles.inlineLegend}>
          <View style={chartStyles.inlineLegendItem}><View style={[chartStyles.legendDot, { backgroundColor: colors.primary }]} /><Text style={chartStyles.cardCaption}>Activas</Text></View>
          <View style={chartStyles.inlineLegendItem}><View style={[chartStyles.legendDot, { backgroundColor: colors.green }]} /><Text style={chartStyles.cardCaption}>Atendidas</Text></View>
        </View>
      </View>
      {!items.length ? <Text style={styles.muted}>{emptyText}</Text> : items.map((item) => {
        const total = item.active + item.completed;
        const activeWidth = total ? (item.active / max) * 100 : 0;
        const completedWidth = total ? (item.completed / max) * 100 : 0;
        return (
          <View key={item.id} style={chartStyles.workloadRow}>
            <View style={chartStyles.workloadHeading}>
              <Text numberOfLines={1} style={chartStyles.workloadName}>{item.name}</Text>
              <Text style={chartStyles.legendValue}>{total}</Text>
            </View>
            <View
              accessibilityRole="image"
              accessibilityLabel={`${item.name}: ${item.active} activas y ${item.completed} atendidas`}
              style={chartStyles.stackedBar}
            >
              {!!item.active && <View style={{ width: `${activeWidth}%`, height: '100%', backgroundColor: colors.primary }} />}
              {!!item.completed && <View style={{ width: `${completedWidth}%`, height: '100%', backgroundColor: colors.green }} />}
              {!total && <View style={[chartStyles.emptyBar, { flex: 1 }]} />}
            </View>
            <Text style={chartStyles.workloadCaption}>{item.active} activas · {item.completed} atendidas</Text>
          </View>
        );
      })}
    </Card>
  );
}

function RatingChart({ reviews }: { reviews: Review[] }) {
  const counts = [1, 2, 3, 4, 5].map((stars) => reviews.filter((review) => review.estrellas === stars).length);
  const max = Math.max(1, ...counts);
  return (
    <Card>
      <View style={chartStyles.cardHeading}>
        <Text style={styles.adminSectionTitle}>Distribución de valoraciones</Text>
        <Text style={chartStyles.cardCaption}>{reviews.length} recientes</Text>
      </View>
      {!reviews.length ? <Text style={styles.muted}>Todavía no hay valoraciones para mostrar.</Text> : (
        <View accessibilityRole="image" accessibilityLabel="Cantidad de valoraciones por estrellas" style={chartStyles.ratingChart}>
          {counts.map((value, index) => (
            <View key={index + 1} style={chartStyles.ratingColumn}>
              <Text style={chartStyles.ratingCount}>{value}</Text>
              <View style={chartStyles.ratingTrack}>
                <View style={[chartStyles.ratingFill, { height: `${(value / max) * 100}%` }]} />
              </View>
              <Text style={chartStyles.ratingLabel}>{index + 1} ★</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={chartStyles.footnote}>Basado en las últimas {reviews.length} valoraciones disponibles.</Text>
    </Card>
  );
}

/**
 * Agrupa métricas y gráficos del panel administrativo para resumir actividad, workload y valoraciones.
 */
export default function AdminCharts({
  summary,
  statistics,
  reviews,
}: {
  summary: AdminSummary;
  statistics: StatisticsResponse;
  reviews: Review[];
}) {
  const total = count(summary.consultas_total);
  const completion = total ? Math.round((count(summary.finalizadas) / total) * 100) : 0;
  const average = summary.promedio_general == null ? '—' : `${Number(summary.promedio_general).toFixed(2)} ★`;
  const localRows = statistics.locales
    .map((item) => ({ id: item.id, name: item.nombre, active: item.activas, completed: item.atendidas }))
    .sort((a, b) => b.active + b.completed - (a.active + a.completed));
  const technicianRows = statistics.tecnicos
    .filter((item) => !item.deleted_at)
    .map((item) => ({ id: item.id, name: `${item.nombre} ${item.apellido}`, active: item.activas, completed: item.atendidas }))
    .sort((a, b) => b.active + b.completed - (a.active + a.completed))
    .slice(0, 8);

  return <>
    <View style={chartStyles.metrics}>
      <Metric label="Consultas registradas" value={total} caption={`${count(summary.pendientes)} pendientes`} color={colors.primary} />
      <Metric label="En atención" value={count(summary.activas)} caption="Consultas activas" color={colors.amber} />
      <Metric label="Finalizadas" value={`${completion}%`} caption={`${count(summary.finalizadas)} consultas`} color={colors.green} />
      <Metric label="Valoración general" value={average} caption={`${count(summary.valoraciones_total)} valoraciones`} color={colors.rating} />
    </View>
    <StatusChart summary={summary} />
    <WorkloadChart title="Actividad por local" items={localRows} emptyText="Todavía no hay locales para comparar." />
    <WorkloadChart title="Actividad por técnico" items={technicianRows} emptyText="Todavía no hay técnicos para comparar." />
    {statistics.tecnicos.filter((item) => !item.deleted_at).length > technicianRows.length && (
      <Text style={chartStyles.footnote}>Se muestran los 8 técnicos con mayor actividad.</Text>
    )}
    <RatingChart reviews={reviews} />
  </>;
}

const chartStyles = {
  metrics: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  metric: {
    flexGrow: 1,
    flexBasis: '47%' as const,
    minWidth: 145,
    gap: 5,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  metricAccent: { width: 22, height: 4, marginBottom: 3, borderRadius: 3 },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' as const },
  metricValue: { color: colors.text, fontSize: 22, fontWeight: '900' as const, letterSpacing: -0.5 },
  metricCaption: { color: colors.muted, fontSize: 11 },
  cardHeading: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, flexWrap: 'wrap' as const, gap: 8 },
  cardCaption: { color: colors.muted, fontSize: 11 },
  stackedBar: { flexDirection: 'row' as const, width: '100%' as const, height: 13, overflow: 'hidden' as const, borderRadius: 8, backgroundColor: colors.secondarySurface },
  emptyBar: { backgroundColor: colors.secondarySurface },
  legendGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10, marginTop: 4 },
  legendItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, minWidth: '44%' as const },
  legendDot: { width: 8, height: 8, borderRadius: 5 },
  legendLabel: { flex: 1, color: colors.muted, fontSize: 12 },
  legendValue: { color: colors.text, fontSize: 12, fontWeight: '800' as const, fontVariant: ['tabular-nums'] as const },
  inlineLegend: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  inlineLegendItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  workloadRow: { gap: 5 },
  workloadHeading: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  workloadName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' as const },
  workloadCaption: { color: colors.muted, fontSize: 11 },
  ratingChart: { flexDirection: 'row' as const, justifyContent: 'space-around' as const, alignItems: 'stretch' as const, height: 150, paddingTop: 8 },
  ratingColumn: { alignItems: 'center' as const, gap: 5, width: 42 },
  ratingCount: { color: colors.text, fontSize: 12, fontWeight: '800' as const },
  ratingTrack: { justifyContent: 'flex-end' as const, width: 24, flex: 1, overflow: 'hidden' as const, borderRadius: 8, backgroundColor: colors.secondarySurface },
  ratingFill: { width: '100%' as const, minHeight: 3, borderRadius: 8, backgroundColor: colors.rating },
  ratingLabel: { color: colors.muted, fontSize: 11 },
  footnote: { color: colors.muted, fontSize: 11, lineHeight: 16 },
};
