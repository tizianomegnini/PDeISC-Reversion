import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { consultasApi } from './api';
import { Button, Card, Field, Heading, Loading, Message, MotionScrollView, colors, formatDate, fullName, statusLabel, styles } from './ui';

const TECH_ACTIONS = {
  asignada: [['en_proceso', 'Comenzar atención']],
  en_proceso: [['esperando_cliente', 'Esperar al cliente'], ['finalizada', 'Finalizar']],
  esperando_cliente: [['en_proceso', 'Retomar atención'], ['finalizada', 'Finalizar']],
};

function messageTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function Chat({ consultaId, currentUserId, cerrada, canSend, reload, onComposerFocus, onComposerBlur }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const messagesRef = React.useRef(null);
  const nearBottomRef = React.useRef(true);
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
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    setError('');
    try {
      await consultasApi.enviarMensaje(consultaId, content);
      setText('');
      await load();
      nearBottomRef.current = true;
      requestAnimationFrame(() => messagesRef.current?.scrollToEnd({ animated: true }));
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card style={styles.chatCard}>
      <View style={styles.chatHeader}>
        <Heading title="Conversación" subtitle="Mensajes privados · se actualizan automáticamente." />
      </View>
      <ScrollView
        ref={messagesRef}
        nestedScrollEnabled
        style={[styles.chatMessages, { backgroundColor: colors.conversationSurface }]}
        contentContainerStyle={{ flexGrow: 1, justifyContent: messages.length ? 'flex-end' : 'center', gap: 8 }}
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          nearBottomRef.current = contentSize.height - layoutMeasurement.height - contentOffset.y < 60;
        }}
        scrollEventThrottle={100}
        onContentSizeChange={() => {
          if (nearBottomRef.current) messagesRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {loading
          ? <Loading label="Cargando mensajes…" />
          : messages.length
            ? messages.map((message) => {
              const ownMessage = Number(message.autor_id) === Number(currentUserId);
              return (
                <View key={message.id} style={[styles.messageRow, ownMessage ? styles.messageRowOwn : styles.messageRowOther]}>
                  <View style={[styles.messageBubble, ownMessage ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
                    {!ownMessage && (
                      <Text style={styles.messageAuthor}>
                        {fullName({ nombre: message.autor_nombre, apellido: message.autor_apellido })}
                      </Text>
                    )}
                    <Text style={[styles.messageText, ownMessage && styles.messageTextOwn]}>{message.contenido}</Text>
                    <Text style={styles.messageTime}>{messageTime(message.created_at)}</Text>
                  </View>
                </View>
              );
            })
            : <View style={styles.chatEmpty}>
              <Text style={styles.chatEmptyTitle}>Todavía no hay mensajes</Text>
              <Text style={styles.chatEmptySubtitle}>Escribí acá para conversar con el equipo de soporte.</Text>
            </View>}
      </ScrollView>
      {!!error && <Message>{error}</Message>}
      {cerrada
        ? <Text style={styles.chatClosed}>Esta consulta finalizó y la conversación está cerrada.</Text>
        : canSend ? <>
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Escribí un mensaje"
              value={text}
              onChangeText={setText}
              placeholder="Escribí un mensaje"
              placeholderTextColor={colors.placeholder}
              multiline
              maxLength={2000}
              editable={!busy}
              returnKeyType="default"
              onFocus={onComposerFocus}
              onBlur={onComposerBlur}
              style={styles.composerInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              onPress={send}
              disabled={busy || !text.trim()}
              style={[styles.sendButton, (busy || !text.trim()) && styles.sendButtonDisabled]}
            >
              {busy
                ? <ActivityIndicator size="small" color={colors.textOnPrimary} />
                : <Text style={styles.sendButtonText}>➤</Text>}
            </Pressable>
          </View>
        </> : <Text style={styles.chatClosed}>La cuenta de administración puede leer la conversación, pero no enviar mensajes.</Text>}
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
  const detailScrollRef = React.useRef(null);
  const chatInputFocused = React.useRef(false);
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
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (chatInputFocused.current) {
        detailScrollRef.current?.scrollToEnd({ animated: true });
      }
    });
    return () => subscription.remove();
  }, []);

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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <MotionScrollView ref={detailScrollRef} style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
      <Chat
        consultaId={consulta.id}
        currentUserId={user.id}
        cerrada={closed}
        canSend={user.rol !== 'admin'}
        reload={load}
        onComposerFocus={() => { chatInputFocused.current = true; }}
        onComposerBlur={() => { chatInputFocused.current = false; }}
      />
      {user.rol === 'admin' && <Button title="Volver al panel" variant="secondary" onPress={onDone} />}
    </MotionScrollView>
    </KeyboardAvoidingView>
  );
}
