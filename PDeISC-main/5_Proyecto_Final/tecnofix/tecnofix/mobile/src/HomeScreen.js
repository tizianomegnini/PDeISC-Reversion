import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { consultasApi, tecnicoApi } from './api';
import { Button, Card, Empty, Field, Heading, Loading, Message, MotionScrollView, colors, formatDate, statusLabel, styles } from './ui';

const EQUIPMENT = ['Celular', 'Notebook', 'PC de escritorio', 'Tablet', 'Consola', 'Impresora', 'Otro'];

function ConsultationItem({ item, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.spaceBetween}>
          <Text style={styles.itemTitle}>Consulta #{item.id}</Text>
          <Text style={styles.status}>{statusLabel(item.estado)}</Text>
        </View>
        <Text style={styles.itemMeta}>{item.tipo_equipo} · {item.marca} {item.modelo}</Text>
        <Text numberOfLines={2} style={styles.muted}>{item.descripcion}</Text>
        <Text style={styles.itemMeta}>{formatDate(item.created_at)}{item.tecnico_nombre ? ` · ${item.tecnico_nombre} ${item.tecnico_apellido || ''}` : ''}</Text>
      </Card>
    </Pressable>
  );
}

function NewConsultation({ onBack, onCreated }) {
  const [form, setForm] = useState({ tipo_equipo: '', marca: '', modelo: '', descripcion: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const { consulta } = await consultasApi.create(form);
      onCreated(consulta);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.content}>
      <Button title="← Volver a mis consultas" variant="secondary" onPress={onBack} />
      <Card>
        <Heading title="Nueva consulta" subtitle="Contanos qué le pasa a tu equipo. Los datos del equipo son opcionales." />
        <Text style={styles.label}>Tipo de equipo</Text>
        <View style={styles.row}>
          {EQUIPMENT.map((type) => (
            <Button key={type} title={form.tipo_equipo === type ? `✓ ${type}` : type} small variant={form.tipo_equipo === type ? 'primary' : 'secondary'} onPress={() => update('tipo_equipo')(form.tipo_equipo === type ? '' : type)} />
          ))}
        </View>
        <Field label="Marca (opcional)" value={form.marca} onChangeText={update('marca')} maxLength={60} />
        <Field label="Modelo (opcional)" value={form.modelo} onChangeText={update('modelo')} maxLength={80} />
        <Field label="Descripción del problema" value={form.descripcion} onChangeText={update('descripcion')} multiline maxLength={2000} placeholder="Contanos cuándo empezó y qué intentaste hacer (mínimo 10 caracteres)." />
        {!!error && <Message>{error}</Message>}
        <Button title={busy ? 'Enviando…' : 'Crear consulta'} onPress={submit} disabled={busy} />
      </Card>
    </View>
  );
}

export default function HomeScreen({ user, onNavigate }) {
  const [view, setView] = useState('list');
  const [data, setData] = useState(null);
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const isTechnician = user.rol === 'tecnico';

  const load = useCallback(async () => {
    setError('');
    try {
      const [result, summary] = await Promise.all([
        consultasApi.list(),
        isTechnician ? tecnicoApi.resumen() : Promise.resolve(null),
      ]);
      setData(result.consultas);
      setTech(summary);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isTechnician]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (view === 'new') {
    return <MotionScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <NewConsultation onBack={() => setView('list')} onCreated={(item) => { setView('list'); onNavigate('detail', item.id); }} />
    </MotionScrollView>;
  }
  if (loading) return <Loading />;

  const active = (data || []).filter((item) => !['finalizada', 'cancelada'].includes(item.estado)).length;
  const closed = (data || []).filter((item) => item.estado === 'finalizada').length;
  const actions = (data || []).filter((item) => item.estado === 'asignada' || item.estado === 'en_proceso' || item.estado === 'esperando_cliente').length;

  return (
    <MotionScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <Heading
        title={isTechnician ? 'Panel técnico' : 'Mis consultas'}
        subtitle={isTechnician ? 'Revisá los casos que tenés asignados y continuá la atención.' : 'Creá una consulta, seguí el estado del equipo y conversá con el técnico.'}
      />
      {!!error && <Message>{error}</Message>}
      {isTechnician && tech?.tecnico && (
        <Card>
          <Text style={styles.itemTitle}>{tech.tecnico.local_nombre}</Text>
          <Text style={styles.muted}>{tech.tecnico.especialidad || 'Soporte técnico'} · {tech.stats?.activas || 0} consultas activas · {tech.stats?.atendidas || 0} finalizadas</Text>
        </Card>
      )}
      {!isTechnician && <Button title="+ Nueva consulta" onPress={() => setView('new')} />}
      <View style={styles.row}>
        <Card style={{ flex: 1 }}><Text style={styles.itemMeta}>Consultas</Text><Text style={styles.statNumber}>{data?.length || 0}</Text></Card>
        <Card style={{ flex: 1 }}><Text style={styles.itemMeta}>{isTechnician ? 'Activas' : 'En seguimiento'}</Text><Text style={styles.statNumber}>{isTechnician ? actions : active}</Text></Card>
        <Card style={{ flex: 1 }}><Text style={styles.itemMeta}>Finalizadas</Text><Text style={styles.statNumber}>{closed}</Text></Card>
      </View>
      <View style={styles.spaceBetween}>
        <Text style={styles.itemTitle}>{isTechnician ? 'Casos asignados' : 'Seguimiento'}</Text>
        <Button small title="Actualizar" variant="secondary" onPress={onRefresh} />
      </View>
      {data?.length
        ? data.map((item) => <ConsultationItem key={item.id} item={item} onPress={() => onNavigate('detail', item.id)} />)
        : <Card><Empty>{isTechnician ? 'Todavía no tenés consultas asignadas.' : 'Todavía no tenés consultas. Creá una cuando necesites ayuda con un equipo.'}</Empty></Card>}
    </MotionScrollView>
  );
}
