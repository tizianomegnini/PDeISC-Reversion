import { pool } from '../config/db.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

export async function sendExpoPushNotifications(tokens, notification, fetchImpl = fetch) {
  for (let start = 0; start < tokens.length; start += EXPO_BATCH_SIZE) {
    const batch = tokens.slice(start, start + EXPO_BATCH_SIZE);
    const messages = batch.map(({ token }) => ({
      to: token,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    }));
    const response = await fetchImpl(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!response.ok) {
      throw new Error(`Expo Push API respondió HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!Array.isArray(result.data) || result.data.length !== batch.length) {
      throw new Error('Expo Push API devolvió una respuesta inválida');
    }
    for (const [index, ticket] of result.data.entries()) {
      if (ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        if (batch[index].usuario_id) {
          await pool.execute(
            'DELETE FROM push_tokens WHERE token = ? AND usuario_id = ?',
            [batch[index].token, batch[index].usuario_id],
          );
        }
      } else if (ticket?.status !== 'ok') {
        console.error('Expo Push no aceptó una notificación:', ticket?.message || ticket?.details?.error || 'error desconocido');
      }
    }
  }
}

export async function notifyUser(usuarioId, notification, eventName) {
  if (!usuarioId) return;
  try {
    const [tokens] = await pool.execute('SELECT token, usuario_id FROM push_tokens WHERE usuario_id = ?', [usuarioId]);
    if (!tokens.length) return;
    await sendExpoPushNotifications(tokens, notification);
  } catch (error) {
    console.error(`No se pudo enviar la notificación "${eventName}" al usuario ${usuarioId}:`, error);
  }
}

export async function notifyTechnician(tecnicoId, notification, eventName) {
  if (!tecnicoId) return;
  try {
    const [rows] = await pool.execute('SELECT usuario_id FROM tecnicos WHERE id = ?', [tecnicoId]);
    if (rows[0]) await notifyUser(rows[0].usuario_id, notification, eventName);
  } catch (error) {
    console.error(`No se pudo resolver el destinatario técnico para "${eventName}":`, error);
  }
}
