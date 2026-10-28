import './env-test.js';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, closeDb, registrarCliente, crearTecnico, crearAdmin, login, api, crearConsulta, consultaBody, PASSWORD } from './helpers.js';

let cli1, cli2, tecA, tecB, tokA, tokB, admTok, consulta;

before(async () => {
  await resetDb();
  cli1 = await registrarCliente(); cli2 = await registrarCliente();
  tecA = await crearTecnico({ limite: 1 }); tecB = await crearTecnico({ limite: 1 });
  const adm = await crearAdmin();
  tokA = await login(tecA.email); tokB = await login(tecB.email); admTok = await login(adm.email);
  consulta = await crearConsulta(cli1.token);
});
after(closeDb);

test('cliente no puede usar endpoints de administrador ni de técnico', async () => {
  for (const [m, u] of [['get', '/admin/resumen'], ['get', '/admin/tecnicos'], ['post', '/admin/locales'], ['get', '/admin/auditoria'], ['get', '/tecnico/resumen']]) {
    assert.equal((await api(cli1.token)[m](u).send({})).status, 403, `${m} ${u}`);
  }
});

test('técnico no puede usar endpoints de administrador ni crear consultas', async () => {
  assert.equal((await api(tokA).get('/admin/resumen')).status, 403);
  assert.equal((await api(tokA).post('/admin/tecnicos').send({})).status, 403);
  assert.equal((await api(tokA).put(`/admin/tecnicos/${tecB.tecnicoId}/password`).send({ password: 'Temporal987' })).status, 403);
  assert.equal((await api(tokA).post('/consultas').send(consultaBody())).status, 403);
});

test('administrador no puede crear consultas ni calificar', async () => {
  assert.equal((await api(admTok).post('/consultas').send(consultaBody())).status, 403);
  assert.equal((await api(admTok).post(`/consultas/${consulta.id}/valoracion`).send({ estrellas: 5 })).status, 403);
});

test('endpoints protegidos exigen autenticación', async () => {
  for (const u of ['/consultas', '/admin/resumen', '/tecnico/resumen']) assert.equal((await api().get(u)).status, 401, u);
});

test('un cliente solo ve sus propias consultas', async () => {
  assert.equal((await api(cli2.token).get(`/consultas/${consulta.id}`)).status, 404);
  assert.equal((await api(cli2.token).get(`/consultas/${consulta.id}/mensajes`)).status, 404);
  assert.equal((await api(cli2.token).post(`/consultas/${consulta.id}/mensajes`).send({ contenido: 'hola' })).status, 404);
  assert.equal((await api(cli2.token).patch(`/consultas/${consulta.id}/estado`).send({ estado: 'cancelada' })).status, 404);
  assert.equal((await api(cli2.token).get('/consultas')).body.consultas.length, 0);
  assert.equal((await api(cli1.token).get(`/consultas/${consulta.id}`)).status, 200);
});

test('un técnico no puede acceder a consultas de otro técnico', async () => {
  const asignado = consulta.tecnico_id === tecA.tecnicoId ? { tok: tokA, otro: tokB } : { tok: tokB, otro: tokA };
  assert.equal((await api(asignado.tok).get(`/consultas/${consulta.id}`)).status, 200);
  assert.equal((await api(asignado.otro).get(`/consultas/${consulta.id}`)).status, 404);
  assert.equal((await api(asignado.otro).get(`/consultas/${consulta.id}/mensajes`)).status, 404);
  assert.equal((await api(asignado.otro).post(`/consultas/${consulta.id}/mensajes`).send({ contenido: 'intruso' })).status, 404);
  assert.equal((await api(asignado.otro).patch(`/consultas/${consulta.id}/estado`).send({ estado: 'en_proceso' })).status, 404);
  assert.equal((await api(asignado.otro).get('/consultas')).body.consultas.length, 0);
});

test('el técnico no puede calificar y el cliente no puede cambiar a estados de técnico', async () => {
  const tok = consulta.tecnico_id === tecA.tecnicoId ? tokA : tokB;
  assert.equal((await api(tok).post(`/consultas/${consulta.id}/valoracion`).send({ estrellas: 5 })).status, 403);
  assert.equal((await api(cli1.token).patch(`/consultas/${consulta.id}/estado`).send({ estado: 'finalizada' })).status, 409);
});

test('el cliente no puede modificar el rol ni el técnico desde su perfil', async () => {
  const r = await api(cli1.token).put('/auth/me').send({ nombre: 'A', apellido: 'B', rol: 'admin', tecnico_id: 1 });
  assert.equal(r.status, 200);
  assert.equal((await api(cli1.token).get('/auth/me')).body.usuario.rol, 'cliente');
});

test('administrador: alta de técnico con contraseña temporal y cambio obligatorio', async () => {
  const loc = await api(admTok).post('/admin/locales').send({ nombre: 'Sucursal Test', direccion: 'Calle 1', ciudad: 'MdP' });
  assert.equal(loc.status, 201);
  const r = await api(admTok).post('/admin/tecnicos').send({ nombre: 'Nuevo', apellido: 'Tec', email: 'nuevo.tec@test.local', local_id: loc.body.id });
  assert.equal(r.status, 201);
  assert.ok(r.body.password_temporal);
  const tok = await login('nuevo.tec@test.local', r.body.password_temporal);
  assert.equal((await api(tok).get('/consultas')).status, 403, 'debe cambiar la contraseña primero');
  assert.equal((await api(admTok).post('/admin/tecnicos').send({ nombre: 'X', apellido: 'Y', email: 'nuevo.tec@test.local', local_id: loc.body.id })).status, 409);
});

test('administrador: restablece contraseña del técnico y obliga a cambiarla', async () => {
  const t = await crearTecnico({ email: 'reset.tec@test.local' });
  const nueva = 'Temporal987';
  assert.equal((await api(admTok).put(`/admin/tecnicos/${t.tecnicoId}/password`).send({ password: 'corta' })).status, 400);
  assert.equal((await api(admTok).put(`/admin/tecnicos/${t.tecnicoId}/password`).send({ password: nueva })).status, 200);
  assert.equal((await api().post('/auth/login').send({ email: t.email, password: PASSWORD })).status, 401);

  const token = await login(t.email, nueva);
  assert.equal((await api(token).get('/consultas')).status, 403, 'hasta cambiarla solo se permite el flujo de cambio de contraseña');
  assert.equal((await api(token).get('/auth/me')).body.usuario.debe_cambiar_password, true);
  assert.equal((await api(token).post('/auth/change-password').send({ actual: nueva, nueva: 'NuevaClave123' })).status, 200);
  assert.equal((await api(token).get('/consultas')).status, 200);

  const auditoria = (await api(admTok).get('/admin/auditoria')).body.auditoria;
  assert.ok(auditoria.some((x) => x.accion === 'tecnico.password_restablecida'));
  assert.ok(!JSON.stringify(auditoria).includes(nueva), 'la contraseña no queda expuesta en auditoría');
});

test('administrador: eliminar técnico es lógico, conserva historial y bloquea su acceso', async () => {
  const t = await crearTecnico({ email: 'borrar@test.local' });
  const tok = await login(t.email);
  assert.equal((await api(admTok).delete(`/admin/tecnicos/${t.tecnicoId}`)).status, 200);
  assert.equal((await api(tok).get('/consultas')).status, 401);
  const lista = (await api(admTok).get('/admin/tecnicos')).body.tecnicos;
  const fila = lista.find((x) => x.id === t.tecnicoId);
  assert.ok(fila, 'sigue existiendo en la base');
  assert.ok(fila.deleted_at);
});

test('las acciones administrativas quedan en la auditoría', async () => {
  const a = (await api(admTok).get('/admin/auditoria')).body.auditoria;
  assert.ok(a.some((x) => x.accion === 'tecnico.creado'));
  assert.ok(a.some((x) => x.accion === 'tecnico.eliminado_logico'));
});
