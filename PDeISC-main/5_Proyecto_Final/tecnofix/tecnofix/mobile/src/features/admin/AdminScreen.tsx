import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { adminApi } from '../../api';
import { Button, Card, Empty, Field, Heading, Loading, Message, MotionScrollView, colors, formatDate, fullName, styles } from '../../ui';
import { getErrorMessage, type AdminSummary, type Consultation, type Location, type Review, type StatisticsResponse, type Technician } from '../../types';
import AdminCharts from './AdminCharts';
import AdminConfirmDialog, { type TechnicianAction } from './AdminConfirmDialog';

const TABS = [
  ['resumen', 'Resumen', '▦'],
  ['pendientes', 'Pendientes', '◷'],
  ['tecnicos', 'Técnicos', '♙'],
  ['locales', 'Locales', '⌖'],
  ['estadisticas', 'Estadísticas', '▤'],
  ['valoraciones', 'Valoraciones', '★'],
  ['config', 'Configuración', '⚙'],
] as const;
type AdminTab = typeof TABS[number][0];
type TechnicianEdit = Pick<Technician, 'id' | 'nombre' | 'apellido' | 'habilitado'> & {
  telefono: string;
  local_id: string;
  especialidad: string;
  limite_consultas: string;
};
type LocationEdit = Omit<Location, 'telefono'> & { telefono: string };

function Stat({ icon, label, value, color = colors.primary }: {
  icon: string;
  label: string;
  value?: string | number | null;
  color?: string;
}) {
  return (
    <Card style={styles.adminStatCard}>
      <View style={styles.spaceBetween}>
        <View style={styles.adminStatIcon}><Text style={[styles.adminStatIconText, { color }]}>{icon}</Text></View>
        <View style={[styles.adminStatAccent, { backgroundColor: color }]} />
      </View>
      <Text style={styles.adminStatValue}>{value ?? '—'}</Text>
      <Text style={styles.itemMeta}>{label}</Text>
    </Card>
  );
}

function QuickAction({ icon, title, subtitle, onPress }: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.adminAction, pressed && styles.buttonPressed]}>
      <View style={styles.spaceBetween}>
        <View style={styles.adminActionIcon}><Text style={styles.adminActionIconText}>{icon}</Text></View>
        <Text style={styles.adminActionArrow}>›</Text>
      </View>
      <Text style={styles.adminActionTitle}>{title}</Text>
      <Text style={styles.adminActionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

/**
 * Resumen operativo del panel de administración con métricas, pendientes y accesos rápidos.
 */
function Summary({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const [data, setData] = useState<AdminSummary | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const result = await adminApi.resumen();
      setData(result.resumen);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (error && !data) return <><Message>{error}</Message><Button title="Reintentar" variant="secondary" onPress={load} /></>;
  if (!data) return <Loading label="Preparando el panel…" />;
  const total = Number(data.consultas_total) || 0;
  const completed = Number(data.finalizadas) || 0;
  const completion = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return <>
    {!!error && <Message>{error}</Message>}
    <View style={styles.adminHero}>
      <View style={styles.spaceBetween}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={styles.adminHeroEyebrow}>CENTRO DE CONTROL</Text>
          <Text style={styles.adminHeroTitle}>Vista general</Text>
          <Text style={styles.adminHeroSubtitle}>El estado del soporte, de un vistazo.</Text>
        </View>
        <View style={styles.adminHeroBadge}><Text style={styles.adminHeroBadgeText}>▦</Text></View>
      </View>
      <View style={styles.adminHeroDivider} />
      <View style={styles.adminHeroMetrics}>
        <View style={styles.adminHeroMetric}>
          <Text style={styles.adminHeroMetricValue}>{data.consultas_total ?? 0}</Text>
          <Text style={styles.adminHeroMetricLabel}>CONSULTAS</Text>
        </View>
        <View style={styles.adminHeroMetricDivider} />
        <Pressable accessibilityRole="button" onPress={() => onNavigate('pendientes')} style={styles.adminHeroMetric}>
          <Text style={styles.adminHeroMetricValue}>{data.pendientes ?? 0}</Text>
          <Text style={styles.adminHeroMetricLabel}>PENDIENTES ›</Text>
        </Pressable>
        <View style={styles.adminHeroMetricDivider} />
        <View style={styles.adminHeroMetric}>
          <Text style={styles.adminHeroMetricValue}>{completion}%</Text>
          <Text style={styles.adminHeroMetricLabel}>FINALIZADAS</Text>
        </View>
      </View>
    </View>

    <View style={styles.spaceBetween}>
      <Text style={styles.adminSectionTitle}>Indicadores</Text>
      <Pressable accessibilityRole="button" onPress={load}><Text style={styles.adminRefresh}>Actualizar</Text></Pressable>
    </View>
    <View style={styles.adminStatsGrid}>
      <Stat icon="◷" label="Consultas activas" value={data.activas} color={colors.primary} />
      <Stat icon="✓" label="Finalizadas" value={data.finalizadas} color={colors.green} />
      <Stat icon="♙" label="Técnicos habilitados" value={data.tecnicos_habilitados} color={colors.amber} />
      <Stat icon="⌖" label="Locales activos" value={data.locales_activos} color={colors.primaryDark} />
      <Stat icon="★" label="Valoraciones" value={data.valoraciones_total} color={colors.rating} />
      <Stat icon="✦" label="Promedio general" value={data.promedio_general == null ? '—' : Number(data.promedio_general).toFixed(1)} color={colors.rating} />
    </View>

    <View style={styles.adminProgressCard}>
      <View style={styles.spaceBetween}>
        <View>
          <Text style={styles.adminSectionTitle}>Consultas resueltas</Text>
          <Text style={styles.itemMeta}>{completed} de {total} finalizadas</Text>
        </View>
        <Text style={styles.adminProgressPercent}>{completion}%</Text>
      </View>
      <View style={styles.adminProgressTrack}>
        <View style={[styles.adminProgressFill, { width: `${completion}%` }]} />
      </View>
    </View>

    <View style={styles.adminSectionHeading}>
      <Text style={styles.adminSectionTitle}>Accesos rápidos</Text>
      <Text style={styles.itemMeta}>Administrá lo más importante</Text>
    </View>
    <View style={styles.adminActionsGrid}>
      <QuickAction icon="◷" title="Pendientes" subtitle="Asignar consultas" onPress={() => onNavigate('pendientes')} />
      <QuickAction icon="♙" title="Técnicos" subtitle="Gestionar el equipo" onPress={() => onNavigate('tecnicos')} />
      <QuickAction icon="⌖" title="Locales" subtitle="Ver sucursales" onPress={() => onNavigate('locales')} />
      <QuickAction icon="▤" title="Estadísticas" subtitle="Revisar actividad" onPress={() => onNavigate('estadisticas')} />
    </View>
  </>;
}

/**
 * Lista de consultas pendientes de asignación con la acción de reasignación automática.
 */
function Pending({ onOpen }: { onOpen: (id: number) => void }) {
  const [items, setItems] = useState<Consultation[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setItems((await adminApi.pendientes()).consultas); setError(''); }
    catch (e) { setError(getErrorMessage(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const assign = async (id: number) => {
    try { await adminApi.asignar(id); await load(); }
    catch (e) { setError(getErrorMessage(e)); }
  };
  const retry = async () => {
    try { await adminApi.reintentar(); await load(); }
    catch (e) { setError(getErrorMessage(e)); }
  };
  return <>
    <Button title="Reintentar asignación automática" variant="secondary" onPress={retry} />
    {!!error && <Message>{error}</Message>}
    {items === null ? <Loading /> : items.length ? items.map((item) => (
      <Card key={item.id}>
        <Text style={styles.itemTitle}>Consulta #{item.id} · {item.tipo_equipo}</Text>
        <Text style={styles.muted}>{item.descripcion}</Text>
        <Text style={styles.itemMeta}>{fullName({ nombre: item.cliente_nombre, apellido: item.cliente_apellido })} · {formatDate(item.created_at)}</Text>
        <View style={styles.row}>
          <Button title="Ver detalle" variant="secondary" small onPress={() => onOpen(item.id)} />
          <Button title="Asignar disponible" small onPress={() => assign(item.id)} />
        </View>
      </Card>
    )) : <Card><Empty>No hay consultas pendientes.</Empty></Card>}
  </>;
}

/**
 * Gestión de profesionales: alta, edición, activación, desactivación y eliminación.
 */
function Technicians() {
  const [items, setItems] = useState<Technician[] | null>(null);
  const [locales, setLocales] = useState<Location[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TechnicianEdit | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<{ technician: Technician; action: TechnicianAction } | null>(null);
  const [confirmError, setConfirmError] = useState('');
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', local_id: '', especialidad: '', limite_consultas: '20' });
  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const load = useCallback(async () => {
    try {
      const [technicians, locations] = await Promise.all([adminApi.tecnicos(), adminApi.locales()]);
      setItems(technicians.tecnicos);
      setLocales(locations.locales.filter((local) => local.activo));
    } catch (e) { setError(getErrorMessage(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    setError(''); setMessage('');
    try {
      const result = await adminApi.crearTecnico({
        nombre: form.nombre, apellido: form.apellido, email: form.email, telefono: form.telefono || null,
        local_id: Number(form.local_id), especialidad: form.especialidad || null, limite_consultas: Number(form.limite_consultas),
      });
      setCreating(false);
      setForm({ nombre: '', apellido: '', email: '', telefono: '', local_id: '', especialidad: '', limite_consultas: '20' });
      setMessage(result.password_temporal ? `Técnico creado. Contraseña temporal (mostrala ahora): ${result.password_temporal}` : 'Técnico creado.');
      await load();
    } catch (e) { setError(getErrorMessage(e)); }
  };
  const requestConfirmation = (technician: Technician, action: TechnicianAction) => {
    setConfirmError('');
    setConfirmation({ technician, action });
  };
  const confirmAction = async () => {
    if (!confirmation || confirmBusy) return;
    setConfirmBusy(true);
    setConfirmError('');
    try {
      const { technician, action } = confirmation;
      if (action === 'activate') await adminApi.estadoTecnico(technician.id, true);
      else if (action === 'deactivate') await adminApi.estadoTecnico(technician.id, false);
      else await adminApi.eliminarTecnico(technician.id);
      setConfirmation(null);
      setMessage(action === 'delete'
        ? 'Técnico eliminado. Se conserva su historial.'
        : action === 'activate' ? 'Técnico activado.' : 'Técnico desactivado.');
      await load();
    } catch (e) {
      setConfirmError(getErrorMessage(e));
    } finally {
      setConfirmBusy(false);
    }
  };
  const beginEdit = (item: Technician) => {
    setEditing({
      id: item.id,
      nombre: item.nombre,
      apellido: item.apellido,
      telefono: item.telefono || '',
      local_id: String(item.local_id),
      especialidad: item.especialidad || '',
      limite_consultas: String(item.limite_consultas),
      habilitado: !!item.habilitado,
    });
    setNewPassword('');
    setError('');
  };
  const saveEdit = async () => {
    setError(''); setMessage('');
    const currentEditing = editing;
    if (!currentEditing) return;
    try {
      await adminApi.editarTecnico(currentEditing.id, {
        nombre: currentEditing.nombre,
        apellido: currentEditing.apellido,
        telefono: currentEditing.telefono || null,
        local_id: Number(currentEditing.local_id),
        especialidad: currentEditing.especialidad || null,
        limite_consultas: Number(currentEditing.limite_consultas),
        habilitado: currentEditing.habilitado,
      });
      if (newPassword) await adminApi.restablecerPasswordTecnico(currentEditing.id, newPassword);
      setEditing(null);
      setNewPassword('');
      setMessage('Técnico actualizado.');
      await load();
    } catch (e) { setError(getErrorMessage(e)); }
  };
  const updateEditing = <K extends keyof TechnicianEdit,>(key: K, value: TechnicianEdit[K]) => {
    setEditing((current) => current ? { ...current, [key]: value } : current);
  };
  return <>
    <Button title={creating ? 'Cerrar formulario' : '+ Nuevo técnico'} onPress={() => setCreating((value) => !value)} />
    {!!error && <Message>{error}</Message>}
    {!!message && <Message type="success">{message}</Message>}
    {creating && <Card>
      <Heading title="Crear técnico" subtitle="Si no ingresás una contraseña, el servidor genera una temporal." />
      <Field label="Nombre" value={form.nombre} onChangeText={update('nombre')} />
      <Field label="Apellido" value={form.apellido} onChangeText={update('apellido')} />
      <Field label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" />
      <Field label="Teléfono" value={form.telefono} onChangeText={update('telefono')} keyboardType="phone-pad" />
      <Field label="ID de local" value={form.local_id} onChangeText={update('local_id')} keyboardType="number-pad" placeholder={locales.map((local) => `${local.id}: ${local.nombre}`).join(' · ') || 'Crear un local primero'} />
      {!!locales.length && <Text style={styles.muted}>Locales: {locales.map((local) => `${local.id} — ${local.nombre}`).join('  ·  ')}</Text>}
      <Field label="Especialidad" value={form.especialidad} onChangeText={update('especialidad')} />
      <Field label="Límite de consultas activas" value={form.limite_consultas} onChangeText={update('limite_consultas')} keyboardType="number-pad" />
      <Button title="Crear técnico" onPress={create} />
    </Card>}
    {items === null ? <Loading /> : items.map((item) => (
      <Card key={item.id}>
        {editing?.id === item.id ? <>
          <Heading title={`Editar ${item.nombre} ${item.apellido}`} />
          <Field label="Nombre" value={editing.nombre} onChangeText={(value) => updateEditing('nombre', value)} />
          <Field label="Apellido" value={editing.apellido} onChangeText={(value) => updateEditing('apellido', value)} />
          <Field label="Teléfono" value={editing.telefono} onChangeText={(value) => updateEditing('telefono', value)} keyboardType="phone-pad" />
          <Field label="ID de local" value={editing.local_id} onChangeText={(value) => updateEditing('local_id', value)} keyboardType="number-pad" />
          <Field label="Especialidad" value={editing.especialidad} onChangeText={(value) => updateEditing('especialidad', value)} />
          <Field label="Límite de consultas activas" value={editing.limite_consultas} onChangeText={(value) => updateEditing('limite_consultas', value)} keyboardType="number-pad" />
          <Field label="Nueva contraseña (opcional)" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <View style={styles.row}>
            <Button small title={editing.habilitado ? 'Deshabilitar' : 'Habilitar'} variant="secondary" onPress={() => updateEditing('habilitado', !editing.habilitado)} />
            <Button small title="Guardar" onPress={saveEdit} />
            <Button small title="Cancelar" variant="secondary" onPress={() => setEditing(null)} />
          </View>
        </> : <>
          <Text style={styles.itemTitle}>{item.nombre} {item.apellido}</Text>
          <Text style={styles.muted}>{item.email} · {item.local_nombre} · {item.especialidad || 'Sin especialidad'}</Text>
          <Text style={styles.itemMeta}>{item.activo && item.habilitado ? 'Habilitado' : 'Desactivado'} · {item.activas} activas · {item.atendidas} finalizadas · {item.promedio ?? 'Sin valoraciones'}</Text>
          <View style={styles.row}>
            <Button small title="Editar" variant="secondary" onPress={() => beginEdit(item)} />
            <Button
              small
              title={item.activo ? 'Desactivar' : 'Activar'}
              variant="secondary"
              onPress={() => requestConfirmation(item, item.activo ? 'deactivate' : 'activate')}
            />
            <Button small title="Eliminar" variant="danger" onPress={() => requestConfirmation(item, 'delete')} />
          </View>
        </>}
      </Card>
    ))}
    <AdminConfirmDialog
      technician={confirmation?.technician ?? null}
      action={confirmation?.action ?? null}
      busy={confirmBusy}
      error={confirmError}
      onCancel={() => {
        if (!confirmBusy) {
          setConfirmation(null);
          setConfirmError('');
        }
      }}
      onConfirm={confirmAction}
    />
  </>;
}

/**
 * Gestión de locales, actualización de dirección y activación/desactivación de sucursales.
 */
function Locations() {
  const [items, setItems] = useState<Location[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LocationEdit | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre: '', direccion: '', ciudad: '', telefono: '' });
  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const load = useCallback(async () => {
    try { setItems((await adminApi.locales()).locales); }
    catch (e) { setError(getErrorMessage(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    setError('');
    try {
      await adminApi.crearLocal({ ...form, telefono: form.telefono || null });
      setCreating(false);
      setForm({ nombre: '', direccion: '', ciudad: '', telefono: '' });
      await load();
    } catch (e) { setError(getErrorMessage(e)); }
  };
  const toggle = async (local: Location) => {
    try {
      if (local.activo) await adminApi.eliminarLocal(local.id);
      else await adminApi.editarLocal(local.id, { nombre: local.nombre, direccion: local.direccion, ciudad: local.ciudad, telefono: local.telefono ?? null, activo: true });
      await load();
    } catch (e) { setError(getErrorMessage(e)); }
  };
  const beginEdit = (local: Location) => setEditing({ ...local, telefono: local.telefono || '' });
  const saveEdit = async () => {
    setError('');
    const currentEditing = editing;
    if (!currentEditing) return;
    try {
      await adminApi.editarLocal(currentEditing.id, {
        nombre: currentEditing.nombre, direccion: currentEditing.direccion, ciudad: currentEditing.ciudad,
        telefono: currentEditing.telefono || null, activo: !!currentEditing.activo,
      });
      setEditing(null);
      await load();
    } catch (e) { setError(getErrorMessage(e)); }
  };
  const updateEditing = <K extends keyof LocationEdit,>(key: K, value: LocationEdit[K]) => {
    setEditing((current) => current ? { ...current, [key]: value } : current);
  };
  return <>
    <Button title={creating ? 'Cerrar formulario' : '+ Nuevo local'} onPress={() => setCreating((value) => !value)} />
    {!!error && <Message>{error}</Message>}
    {creating && <Card>
      <Heading title="Crear local" />
      <Field label="Nombre" value={form.nombre} onChangeText={update('nombre')} />
      <Field label="Dirección" value={form.direccion} onChangeText={update('direccion')} />
      <Field label="Ciudad" value={form.ciudad} onChangeText={update('ciudad')} />
      <Field label="Teléfono" value={form.telefono} onChangeText={update('telefono')} keyboardType="phone-pad" />
      <Button title="Crear local" onPress={create} />
    </Card>}
    {items === null ? <Loading /> : items.map((local) => (
      <Card key={local.id}>
        {editing?.id === local.id ? <>
          <Heading title={`Editar ${local.nombre}`} />
          <Field label="Nombre" value={editing.nombre} onChangeText={(value) => updateEditing('nombre', value)} />
          <Field label="Dirección" value={editing.direccion} onChangeText={(value) => updateEditing('direccion', value)} />
          <Field label="Ciudad" value={editing.ciudad} onChangeText={(value) => updateEditing('ciudad', value)} />
          <Field label="Teléfono" value={editing.telefono} onChangeText={(value) => updateEditing('telefono', value)} keyboardType="phone-pad" />
          <View style={styles.row}>
            <Button small title={editing.activo ? 'Desactivar' : 'Activar'} variant="secondary" onPress={() => updateEditing('activo', !editing.activo)} />
            <Button small title="Guardar" onPress={saveEdit} />
            <Button small title="Cancelar" variant="secondary" onPress={() => setEditing(null)} />
          </View>
        </> : <>
          <Text style={styles.itemTitle}>{local.nombre}</Text>
          <Text style={styles.muted}>{local.direccion}, {local.ciudad} · {local.telefono || 'Sin teléfono'}</Text>
          <Text style={styles.itemMeta}>{local.activo ? 'Activo' : 'Inactivo'} · {local.tecnicos} técnicos · {local.activas} activas · {local.atendidas} finalizadas</Text>
          <View style={styles.row}>
            <Button small title="Editar" variant="secondary" onPress={() => beginEdit(local)} />
            <Button small title={local.activo ? 'Desactivar' : 'Reactivar'} variant="secondary" onPress={() => toggle(local)} />
          </View>
        </>}
      </Card>
    ))}
  </>;
}

/**
 * Panel de métricas y comparativas de locales y técnicos con valoraciones de servicio.
 */
function Statistics() {
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [statistics, summaryResult, reviewResult] = await Promise.all([
        adminApi.estadisticas(),
        adminApi.resumen(),
        adminApi.valoraciones(),
      ]);
      setData(statistics);
      setSummary(summaryResult.resumen);
      setReviews(reviewResult.valoraciones);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <Message>{error}</Message>;
  if (!data || !summary) return <Loading label="Preparando las estadísticas…" />;
  return <>
    <Heading title="Estadísticas" subtitle="Actividad y experiencia del servicio, de un vistazo." />
    <AdminCharts summary={summary} statistics={data} reviews={reviews} />
    <View style={styles.adminSectionHeading}>
      <Text style={styles.adminSectionTitle}>Detalle por técnico</Text>
      <Pressable accessibilityRole="button" onPress={load}><Text style={styles.adminRefresh}>Actualizar</Text></Pressable>
    </View>
    {data.tecnicos.map((item) => <Card key={item.id}><Text style={styles.itemTitle}>{item.nombre} {item.apellido}</Text><Text style={styles.muted}>{item.local_nombre} · {item.activas} activas · {item.atendidas} finalizadas · promedio {item.promedio ?? '—'}</Text></Card>)}
    <View style={styles.adminSectionHeading}><Text style={styles.adminSectionTitle}>Detalle por local</Text></View>
    {data.locales.map((item) => <Card key={item.id}><Text style={styles.itemTitle}>{item.nombre}</Text><Text style={styles.muted}>{item.tecnicos} técnicos · {item.activas} activas · {item.atendidas} finalizadas · promedio {item.promedio ?? '—'}</Text></Card>)}
  </>;
}

/**
 * Listado público de valoraciones recibidas por la plataforma para revisión administrativa.
 */
function Reviews() {
  const [items, setItems] = useState<Review[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { adminApi.valoraciones().then((result) => setItems(result.valoraciones)).catch((e: unknown) => setError(getErrorMessage(e))); }, []);
  if (error) return <Message>{error}</Message>;
  if (!items) return <Loading />;
  if (!items.length) return <Empty>Todavía no hay valoraciones.</Empty>;
  return items.map((item) => <Card key={item.id}><Text style={styles.itemTitle}>{'★'.repeat(item.estrellas)} · Consulta #{item.consulta_id}</Text><Text style={styles.muted}>Cliente: {item.cliente_nombre} {item.cliente_apellido} · Técnico: {item.tecnico_nombre} {item.tecnico_apellido} · {item.local_nombre}</Text><Text style={styles.muted}>{item.comentario || 'Sin comentario'}</Text><Text style={styles.itemMeta}>{formatDate(item.created_at)}</Text></Card>);
}

/**
 * Ajuste del límite global de consultas activas por defecto para nuevos técnicos.
 */
function Configuration() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { adminApi.config().then((result) => setValue(String(result.limite_consultas_default))).catch((e: unknown) => setError(getErrorMessage(e))); }, []);
  const save = async () => {
    setError(''); setSuccess('');
    try {
      const result = await adminApi.guardarConfig({ limite_consultas_default: Number(value) });
      setValue(String(result.limite_consultas_default));
      setSuccess('Configuración guardada.');
    } catch (e) { setError(getErrorMessage(e)); }
  };
  return <Card><Heading title="Límite por defecto" subtitle="Máximo de consultas activas para los técnicos nuevos." /><Field label="Consultas" value={value} onChangeText={setValue} keyboardType="number-pad" />{!!error && <Message>{error}</Message>}{!!success && <Message type="success">{success}</Message>}<Button title="Guardar" onPress={save} /></Card>;
}

/**
 * Vista principal del administrador con tabs para resumen, pendientes, técnicos, locales y estadísticas.
 */
export default function AdminScreen({ onOpenConsultation }: { onOpenConsultation: (id: number) => void }) {
  const [tab, setTab] = useState<AdminTab>('resumen');
  return <MotionScrollView contentContainerStyle={styles.content}>
    <View style={styles.adminPageHeading}>
      <Text style={styles.adminPageEyebrow}>TECNOFIX</Text>
      <Heading title="Administración" subtitle="Gestioná consultas, equipo y locales desde un solo lugar." />
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adminTabList}>
      {TABS.map(([id, label, icon]) => {
        const selected = tab === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => setTab(id)}
            style={[styles.adminTab, selected && styles.adminTabActive]}
          >
            <Text style={[styles.adminTabIcon, selected && styles.adminTabTextActive]}>{icon}</Text>
            <Text style={[styles.adminTabText, selected && styles.adminTabTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
    {tab === 'resumen' && <Summary onNavigate={setTab} />}
    {tab === 'pendientes' && <Pending onOpen={onOpenConsultation} />}
    {tab === 'tecnicos' && <Technicians />}
    {tab === 'locales' && <Locations />}
    {tab === 'estadisticas' && <Statistics />}
    {tab === 'valoraciones' && <Reviews />}
    {tab === 'config' && <Configuration />}
  </MotionScrollView>;
}
