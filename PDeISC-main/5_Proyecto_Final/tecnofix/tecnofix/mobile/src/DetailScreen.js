import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { consultasApi } from './api';
import { Button, Card, Empty, Field, Heading, Loading, Message, MotionScrollView, colors, formatDate, fullName, statusLabel, styles } from './ui';

const TECH_ACTIONS = {
  asignada: [['en_proceso', 'Comenzar atención']],
  en_proceso: [['esperando_cliente', 'Esperar al cliente'], ['finalizada', 'Finalizar']],
  esperando_cliente: [['en_proceso', 'Retomar atención'], ['finalizada', 'Finalizar']],
};

function Chat({ consultaId, cerrada, canSend, reload }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const result = await consultasApi.mensajes(consultaId);
      setMessages(result.mensajes);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [consultaId]);
  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [load]);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      await consultasApi.enviarMensaje(consultaId, text);
      setText('');
      await load();
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <Heading title="Conversación" subtitle="Los mensajes se actualizan automáticamente." />
      {loading ? <Loading label="Cargando mensajes…" /> : messages.length
        ? messages.map((message) => (
          <View key={message.id} style={{ backgroundColor: colors.conversationSurface, borderRadius: 10, padding: 12, gap: 5 }}>
            <Text style={styles.itemMeta}>{fullName({ nombre: message.autor_nombre, apellido: message.autor_apellido })} · {formatDate(message.created_at)}</Text>
            <Text style={{ color: colors.text, lineHeight: 20 }}>{message.contenido}</Text>
          </View>
        ))
        : <Empty>La conversación empieza acá.</Empty>}
      {!!error && <Message>{error}</Message>}
      {cerrada
        ? <Text style={styles.muted}>La consulta terminó y la conversación está cerrada.</Text>
        : canSend ? <>
          <Field label="Escribí un mensaje" value={text} onChangeText={setText} multiline maxLength={2000} />
          <Button title={busy ? 'Enviando…' : 'Enviar mensaje'} onPress={send} disabled={busy || !text.trim()} />
        </> : <Text style={styles.muted}>La cuenta de administración puede consultar los mensajes, pero no responder.</Text>}
    </Card>
  );
}

function Rating({ consulta, onRated }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (consulta.valoracion_estrellas) {
    return <Card><Text style={styles.itemTitle}>Valoración</Text><Text style={{ color: colors.amber, fontSize: 24 }}>{'★'.repeat(consulta.valoracion_estrellas)}{'☆'.repeat(5 - consulta.valoracion_estrellas)}</Text>{consulta.valoracion_comentario ? <Text style={styles.muted}>{consulta.valoracion_comentario}</Text> : null}</Card>;
  }
  const submit = async () => {
    if (!stars) { setError('Elegí de 1 a 5 estrellas.'); return; }
    setBusy(true);
    setError('');
    try {
      await consultasApi.valorar(consulta.id, stars, comment || null);
      onRated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return <Card>
    <Text style={styles.itemTitle}>¿Cómo fue la atención?</Text>
    <View style={styles.row}>{[1, 2, 3, 4, 5].map((n) => <Pressable key={n} onPress={() => setStars(n)}><Text style={{ fontSize: 34, color: n <= stars ? colors.rating : colors.ratingEmpty }}>{n <= stars ? '★' : '☆'}</Text></Pressable>)}</View>
    <Field label="Comentario opcional" value={comment} onChangeText={setComment} multiline maxLength={500} />
    {!!error && <Message>{error}</Message>}
    <Button title={busy ? 'Enviando…' : 'Enviar valoración'} onPress={submit} disabled={busy} />
  </Card>;
}

export default function DetailScreen({ id, user, onBack, onDone }) {
  const [consulta, setConsulta] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const result = await consultasApi.get(id);
      setConsulta(result.consulta);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const changeStatus = (next) => {
    const execute = async () => {
      setBusy(true);
      try {
        await consultasApi.setEstado(id, next);
        await load();
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    };
    if (next === 'cancelada') Alert.alert('Cancelar consulta', '¿Querés cancelar esta consulta?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: execute },
    ]);
    else execute();
  };

  if (loading) return <Loading />;
  if (error && !consulta) return <View style={styles.content}><Message>{error}</Message><Button title="Volver" onPress={onBack} variant="secondary" /></View>;
  if (!consulta) return null;
  const closed = ['finalizada', 'cancelada'].includes(consulta.estado);
  const equipment = [consulta.tipo_equipo, consulta.marca, consulta.modelo].filter(Boolean).join(' · ');
  return (
    <MotionScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Button title="← Volver" onPress={onBack} variant="secondary" />
      <Heading title={`Consulta #${consulta.id}`} subtitle={`${statusLabel(consulta.estado)} · ${formatDate(consulta.created_at)}`} />
      {!!error && <Message>{error}</Message>}
      <Card>
        <Text style={styles.itemTitle}>Equipo y problema</Text>
        <Text style={styles.label}>Equipo</Text><Text style={styles.muted}>{equipment}</Text>
        <Text style={styles.label}>Descripción</Text><Text style={styles.muted}>{consulta.descripcion}</Text>
        {consulta.finalizada_at && <Text style={styles.itemMeta}>Finalizada: {formatDate(consulta.finalizada_at)}</Text>}
      </Card>
      <Card>
        <Text style={styles.itemTitle}>{user.rol === 'cliente' ? 'Atención' : 'Cliente y asignación'}</Text>
        {user.rol !== 'cliente' && <Text style={styles.muted}>Cliente: {fullName({ nombre: consulta.cliente_nombre, apellido: consulta.cliente_apellido })} · {consulta.cliente_email}</Text>}
        <Text style={styles.muted}>Técnico: {consulta.tecnico_id ? fullName({ nombre: consulta.tecnico_nombre, apellido: consulta.tecnico_apellido }) : 'Sin asignar todavía'}</Text>
        <Text style={styles.muted}>Local: {consulta.local_nombre ? `${consulta.local_nombre} — ${consulta.local_direccion}, ${consulta.local_ciudad}` : '—'}</Text>
        {user.rol === 'tecnico' && (TECH_ACTIONS[consulta.estado] || []).map(([state, label]) => <Button key={state} title={label} onPress={() => changeStatus(state)} disabled={busy} />)}
        {user.rol === 'cliente' && !closed && <Button title="Cancelar consulta" variant="danger" onPress={() => changeStatus('cancelada')} disabled={busy} />}
      </Card>
      {consulta.estado === 'finalizada' && user.rol === 'cliente' && <Rating consulta={consulta} onRated={load} />}
      {consulta.estado === 'finalizada' && user.rol !== 'cliente' && consulta.valoracion_estrellas
        ? <Card><Text style={styles.itemTitle}>Valoración</Text><Text style={{ color: colors.amber, fontSize: 24 }}>{'★'.repeat(consulta.valoracion_estrellas)}{'☆'.repeat(5 - consulta.valoracion_estrellas)}</Text>{consulta.valoracion_comentario ? <Text style={styles.muted}>{consulta.valoracion_comentario}</Text> : null}</Card>
        : null}
      <Chat consultaId={consulta.id} cerrada={closed} canSend={user.rol !== 'admin'} reload={load} />
      {user.rol === 'admin' && <Button title="Volver al panel" variant="secondary" onPress={onDone} />}
    </MotionScrollView>
  );
}
