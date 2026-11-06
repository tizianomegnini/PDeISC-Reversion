import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendExpoPushNotifications } from '../src/services/push.js';

test('envía notificaciones push en lotes de hasta 100 dispositivos', async () => {
  const tokens = Array.from({ length: 205 }, (_, index) => ({ token: `ExponentPushToken[device-${index}]` }));
  const requests = [];
  await sendExpoPushNotifications(tokens, {
    title: 'Nuevo mensaje',
    body: 'Tenés una actualización.',
    data: { type: 'mensaje', consultaId: 7 },
  }, async (_url, options) => {
    const messages = JSON.parse(options.body);
    requests.push(messages);
    return {
      ok: true,
      json: async () => ({ data: messages.map(() => ({ status: 'ok' })) }),
    };
  });

  assert.deepEqual(requests.map((batch) => batch.length), [100, 100, 5]);
  assert.equal(requests[0][0].channelId, 'default');
  assert.equal(requests[0][0].data.consultaId, 7);
});

test('informa los errores HTTP de Expo Push', async () => {
  await assert.rejects(
    sendExpoPushNotifications([{ token: 'ExponentPushToken[device-1]' }], {
      title: 'Test',
      body: 'Test',
      data: {},
    }, async () => ({ ok: false, status: 503 })),
    /HTTP 503/,
  );
});
