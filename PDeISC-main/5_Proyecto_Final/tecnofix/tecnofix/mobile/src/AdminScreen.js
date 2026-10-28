import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { adminApi, consultasApi } from './api';
import { Button, Card, Empty, Field, Heading, Loading, Message, MotionScrollView, formatDate, fullName, statusLabel, styles } from './ui';

const TABS = [
  ['resumen', 'Resumen'],
  ['pendientes', 'Pendientes'],
  ['tecnicos', 'Técnicos'],
  ['locales', 'Locales'],
  ['estadisticas', 'Estadísticas'],
  ['valoraciones', 'Valoraciones'],
  ['config', 'Configuración'],
];

function Stat({ label, value }) {
  return <Card style={{ flexGrow: 1, minWidth: 130 }}><Text style={styles.itemMeta}>{label}</Text><Text style={styles.statNumber}>{value ?? '—'}</Text></Card>;
}

function Summary({ onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { adminApi.resumen().then((result) => setData(result.resumen)).catch((e) => setError(e.message)); }, []);
  if (error) return <Message>{error}</Message>;
  if (!data) return <Loading />;
  return <>
    <View style={styles.row}>
      <Stat label="Consultas totales" value={data.consultas_total} />
      <Stat label="Pendientes" value={data.pendientes} />
      <Stat label="Activas" value={data.activas} />
      <Stat label="Finalizadas" value={data.finalizadas} />
      <Stat label="Técnicos habilitados" value={data.tecnicos_habilitados} />
      <Stat label="Locales activos" value={data.locales_activos} />
      <Stat label="Valoraciones" value={data.valoraciones_total} />
      <Stat label="Promedio general" value={data.promedio_general ?? '—'} />
    </View>
    <Button title="Ver consultas pendientes" onPress={() => onNavigate('pendientes')} />
  </>;
}

function Pending({ onOpen }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setItems((await adminApi.pendientes()).consultas); setError(''); }
    catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const assign = async (id) => {
    try { await adminApi.asignar(id); await load(); }
    catch (e) { setError(e.message); }
  };
  const retry = async () => {
    try { await adminApi.reintentar(); await load(); }
    catch (e) { setError(e.message); }
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

function Technicians() {
  const [items, setItems] = useState(null);
  const [locales, setLocales] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', local_id: '', especialidad: '', limite_consultas: '20' });
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const load = useCallback(async () => {
    try {
      const [technicians, locations] = await Promise.all([adminApi.tecnicos(), adminApi.locales()]);
      setItems(technicians.tecnicos);
      setLocales(locations.locales.filter((local) => local.activo));
    } catch (e) { setError(e.message); }
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
    } catch (e) { setError(e.message); }
  };
  const toggle = async (item) => {
    try { await adminApi.estadoTecnico(item.id, !item.activo); await load(); }
    catch (e) { setError(e.message); }
  };
  const beginEdit = (item) => {
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
    try {
      await adminApi.editarTecnico(editing.id, {
        nombre: editing.nombre,
        apellido: editing.apellido,
        telefono: editing.telefono || null,
        local_id: Number(editing.local_id),
        especialidad: editing.especialidad || null,
        limite_consultas: Number(editing.limite_consultas),
        habilitado: editing.habilitado,
      });
      if (newPassword) await adminApi.restablecerPasswordTecnico(editing.id, newPassword);
      setEditing(null);
      setNewPassword('');
      setMessage('Técnico actualizado.');
      await load();
    } catch (e) { setError(e.message); }
  };
  const remove = (item) => Alert.alert('Eliminar técnico', `¿Eliminar a ${item.nombre} ${item.apellido}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
      try { await adminApi.eliminarTecnico(item.id); await load(); }
      catch (e) { setError(e.message); }
    } },
  ]);
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
          <Field label="Nombre" value={editing.nombre} onChangeText={(value) => setEditing((current) => ({ ...current, nombre: value }))} />
          <Field label="Apellido" value={editing.apellido} onChangeText={(value) => setEditing((current) => ({ ...current, apellido: value }))} />
          <Field label="Teléfono" value={editing.telefono} onChangeText={(value) => setEditing((current) => ({ ...current, telefono: value }))} keyboardType="phone-pad" />
          <Field label="ID de local" value={editing.local_id} onChangeText={(value) => setEditing((current) => ({ ...current, local_id: value }))} keyboardType="number-pad" />
          <Field label="Especialidad" value={editing.especialidad} onChangeText={(value) => setEditing((current) => ({ ...current, especialidad: value }))} />
          <Field label="Límite de consultas activas" value={editing.limite_consultas} onChangeText={(value) => setEditing((current) => ({ ...current, limite_consultas: value }))} keyboardType="number-pad" />
          <Field label="Nueva contraseña (opcional)" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <View style={styles.row}>
            <Button small title={editing.habilitado ? 'Deshabilitar' : 'Habilitar'} variant="secondary" onPress={() => setEditing((current) => ({ ...current, habilitado: !current.habilitado }))} />
            <Button small title="Guardar" onPress={saveEdit} />
            <Button small title="Cancelar" variant="secondary" onPress={() => setEditing(null)} />
          </View>
        </> : <>
          <Text style={styles.itemTitle}>{item.nombre} {item.apellido}</Text>
          <Text style={styles.muted}>{item.email} · {item.local_nombre} · {item.especialidad || 'Sin especialidad'}</Text>
          <Text style={styles.itemMeta}>{item.activo && item.habilitado ? 'Habilitado' : 'Desactivado'} · {item.activas} activas · {item.atendidas} finalizadas · {item.promedio ?? 'Sin valoraciones'}</Text>
          <View style={styles.row}>
            <Button small title="Editar" variant="secondary" onPress={() => beginEdit(item)} />
            <Button small title={item.activo ? 'Desactivar' : 'Activar'} variant="secondary" onPress={() => toggle(item)} />
            <Button small title="Eliminar" variant="danger" onPress={() => remove(item)} />
          </View>
        </>}
      </Card>
    ))}
  </>;
}

function Locations() {
  const [items, setItems] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre: '', direccion: '', ciudad: '', telefono: '' });
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const load = useCallback(async () => {
    try { setItems((await adminApi.locales()).locales); }
    catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    setError('');
    try {
      await adminApi.crearLocal({ ...form, telefono: form.telefono || null });
      setCreating(false);
      setForm({ nombre: '', direccion: '', ciudad: '', telefono: '' });
      await load();
    } catch (e) { setError(e.message); }
  };
  const toggle = async (local) => {
    try {
      if (local.activo) await adminApi.eliminarLocal(local.id);
      else await adminApi.editarLocal(local.id, { nombre: local.nombre, direccion: local.direccion, ciudad: local.ciudad, telefono: local.telefono, activo: true });
      await load();
    } catch (e) { setError(e.message); }
  };
  const beginEdit = (local) => setEditing({ id: local.id, ...local, telefono: local.telefono || '' });
  const saveEdit = async () => {
    setError('');
    try {
      await adminApi.editarLocal(editing.id, {
        nombre: editing.nombre, direccion: editing.direccion, ciudad: editing.ciudad,
        telefono: editing.telefono || null, activo: !!editing.activo,
      });
      setEditing(null);
      await load();
    } catch (e) { setError(e.message); }
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
          <Field label="Nombre" value={editing.nombre} onChangeText={(value) => setEditing((current) => ({ ...current, nombre: value }))} />
          <Field label="Dirección" value={editing.direccion} onChangeText={(value) => setEditing((current) => ({ ...current, direccion: value }))} />
          <Field label="Ciudad" value={editing.ciudad} onChangeText={(value) => setEditing((current) => ({ ...current, ciudad: value }))} />
          <Field label="Teléfono" value={editing.telefono} onChangeText={(value) => setEditing((current) => ({ ...current, telefono: value }))} keyboardType="phone-pad" />
          <View style={styles.row}>
            <Button small title={editing.activo ? 'Desactivar' : 'Activar'} variant="secondary" onPress={() => setEditing((current) => ({ ...current, activo: !current.activo }))} />
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

function Statistics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { adminApi.estadisticas().then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <Message>{error}</Message>;
  if (!data) return <Loading />;
  return <>
    <Heading title="Técnicos" />
    {data.tecnicos.map((item) => <Card key={item.id}><Text style={styles.itemTitle}>{item.nombre} {item.apellido}</Text><Text style={styles.muted}>{item.local_nombre} · {item.activas} activas · {item.atendidas} finalizadas · promedio {item.promedio ?? '—'}</Text></Card>)}
    <Heading title="Locales" />
    {data.locales.map((item) => <Card key={item.id}><Text style={styles.itemTitle}>{item.nombre}</Text><Text style={styles.muted}>{item.tecnicos} técnicos · {item.activas} activas · {item.atendidas} finalizadas · promedio {item.promedio ?? '—'}</Text></Card>)}
  </>;
}

function Reviews() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { adminApi.valoraciones().then((result) => setItems(result.valoraciones)).catch((e) => setError(e.message)); }, []);
  if (error) return <Message>{error}</Message>;
  if (!items) return <Loading />;
  if (!items.length) return <Empty>Todavía no hay valoraciones.</Empty>;
  return items.map((item) => <Card key={item.id}><Text style={styles.itemTitle}>{'★'.repeat(item.estrellas)} · Consulta #{item.consulta_id}</Text><Text style={styles.muted}>Cliente: {item.cliente_nombre} {item.cliente_apellido} · Técnico: {item.tecnico_nombre} {item.tecnico_apellido} · {item.local_nombre}</Text><Text style={styles.muted}>{item.comentario || 'Sin comentario'}</Text><Text style={styles.itemMeta}>{formatDate(item.created_at)}</Text></Card>);
}

function Configuration() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { adminApi.config().then((result) => setValue(String(result.limite_consultas_default))).catch((e) => setError(e.message)); }, []);
  const save = async () => {
    setError(''); setSuccess('');
    try {
      const result = await adminApi.guardarConfig({ limite_consultas_default: Number(value) });
      setValue(String(result.limite_consultas_default));
      setSuccess('Configuración guardada.');
    } catch (e) { setError(e.message); }
  };
  return <Card><Heading title="Límite por defecto" subtitle="Máximo de consultas activas para los técnicos nuevos." /><Field label="Consultas" value={value} onChangeText={setValue} keyboardType="number-pad" />{!!error && <Message>{error}</Message>}{!!success && <Message type="success">{success}</Message>}<Button title="Guardar" onPress={save} /></Card>;
}

export default function AdminScreen({ onOpenConsultation }) {
  const [tab, setTab] = useState('resumen');
  return <MotionScrollView contentContainerStyle={styles.content}>
    <Heading title="Administración" subtitle="Gestioná consultas, técnicos, locales y métricas." />
    <View style={styles.row}>{TABS.map(([id, label]) => <Button key={id} title={tab === id ? `✓ ${label}` : label} small variant={tab === id ? 'primary' : 'secondary'} onPress={() => setTab(id)} />)}</View>
    {tab === 'resumen' && <Summary onNavigate={setTab} />}
    {tab === 'pendientes' && <Pending onOpen={onOpenConsultation} />}
    {tab === 'tecnicos' && <Technicians />}
    {tab === 'locales' && <Locations />}
    {tab === 'estadisticas' && <Statistics />}
    {tab === 'valoraciones' && <Reviews />}
    {tab === 'config' && <Configuration />}
  </MotionScrollView>;
}
