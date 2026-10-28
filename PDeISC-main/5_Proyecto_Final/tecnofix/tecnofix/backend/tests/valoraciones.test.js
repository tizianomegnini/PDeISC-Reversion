import './env-test.js';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, closeDb, registrarCliente, crearTecnico, crearAdmin, login, api, crearConsulta, consultaBody } from './helpers.js';

let cli, otro, tec, tecTok, admTok, c;

before(async () => {
  await resetDb();
  cli = await registrarCliente(); otro = await registrarCliente();
  tec = await crearTecnico(); tecTok = await login(tec.email);
  admTok = await login((await crearAdmin()).email);
  c = await crearConsulta(cli.token);
});
after(closeDb);

test('transiciones de estado: solo las permitidas', async () => {
  assert.equal((await api(tecTok).patch(`/consultas/${c.id}/estado`).send({ estado: 'finalizada' })).status, 409, 'asignada -> finalizada no se permite');
  assert.equal((await api(tecTok).patch(`/consultas/${c.id}/estado`).send({ estado: 'inventado' })).status, 400);
  assert.equal((await api(tecTok).patch(`/consultas/${c.id}/estado`).send({ estado: 'cancelada' })).status, 409, 'el técnico no cancela');
  assert.equal((await api(tecTok).patch(`/consultas/${c.id}/estado`).send({ estado: 'en_proceso' })).status, 200);
});

test('mensajes entre cliente y técnico; la respuesta del cliente reactiva "esperando_cliente"', async () => {
  assert.equal((await api(tecTok).post(`/consultas/${c.id}/mensajes`).send({ contenido: '¿Probó con otro cargador?' })).status, 201);
  assert.equal((await api(tecTok).post(`/consultas/${c.id}/mensajes`).send({ contenido: '   ' })).status, 400);
  await api(tecTok).patch(`/consultas/${c.id}/estado`).send({ estado: 'esperando_cliente' }).expect(200);
  assert.equal((await api(cli.token).post(`/consultas/${c.id}/mensajes`).send({ contenido: 'Sí, sigue igual.' })).status, 201);
  const m = (await api(cli.token).get(`/consultas/${c.id}/mensajes`)).body.mensajes;
  assert.deepEqual(m.map((x) => x.autor_rol), ['tecnico', 'cliente']);
  assert.equal((await api(cli.token).get(`/consultas/${c.id}`)).body.consulta.estado, 'en_proceso');
});

test('no se puede calificar una consulta que no está finalizada', async () => {
  assert.equal((await api(cli.token).post(`/consultas/${c.id}/valoracion`).send({ estrellas: 5 })).status, 409);
});

test('calificación: valida estrellas, solo el dueño, y una única vez', async () => {
  await api(tecTok).patch(`/consultas/${c.id}/estado`).send({ estado: 'finalizada' }).expect(200);
  assert.equal((await api(cli.token).post(`/consultas/${c.id}/mensajes`).send({ contenido: 'gracias' })).status, 409, 'consulta cerrada');
  for (const e of [0, 6, 3.5, '5', null]) {
    assert.equal((await api(cli.token).post(`/consultas/${c.id}/valoracion`).send({ estrellas: e })).status, 400, `estrellas=${e}`);
  }
  assert.equal((await api(otro.token).post(`/consultas/${c.id}/valoracion`).send({ estrellas: 5 })).status, 404, 'otro cliente no puede');
  const ok = await api(cli.token).post(`/consultas/${c.id}/valoracion`).send({ estrellas: 4, comentario: 'Muy buena atención' });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.consulta.valoracion_estrellas, 4);
  assert.equal((await api(cli.token).post(`/consultas/${c.id}/valoracion`).send({ estrellas: 5 })).status, 409, 'no se califica dos veces');
  // en paralelo tampoco (UNIQUE en la base)
  const c2 = await crearConsulta(cli.token);
  await api(tecTok).patch(`/consultas/${c2.id}/estado`).send({ estado: 'en_proceso' });
  await api(tecTok).patch(`/consultas/${c2.id}/estado`).send({ estado: 'finalizada' });
  const rs = await Promise.all([1, 2, 3, 4].map(() => api(cli.token).post(`/consultas/${c2.id}/valoracion`).send({ estrellas: 5 })));
  assert.equal(rs.filter((r) => r.status === 201).length, 1);
});

test('el técnico ve su promedio y trabajos atendidos; el admin ve estadísticas', async () => {
  const r = await api(tecTok).get('/tecnico/resumen');
  assert.equal(r.status, 200);
  assert.equal(r.body.stats.atendidas, 2);
  assert.equal(r.body.stats.cantidad_valoraciones, 2);
  assert.equal(r.body.stats.promedio, 4.5);
  const est = (await api(admTok).get('/admin/estadisticas')).body;
  assert.equal(est.tecnicos.find((t) => t.id === tec.tecnicoId).promedio, 4.5);
  assert.equal(est.locales.find((l) => l.id === tec.localId).atendidas, 2);
  const res = (await api(admTok).get('/admin/resumen')).body.resumen;
  assert.equal(res.valoraciones_total, 2);
  assert.equal((await api(admTok).get('/admin/valoraciones')).body.valoraciones.length, 2);
});

test('datos del equipo opcionales y descripción obligatoria', async () => {
  assert.equal((await api(cli.token).post('/consultas').send(consultaBody({ descripcion: 'corta' }))).status, 400);
  const sinDatosEquipo = await api(cli.token).post('/consultas').send({ descripcion: 'No sé qué tipo de equipo es ni cuál es el modelo.' });
  assert.equal(sinDatosEquipo.status, 201);
  assert.equal(sinDatosEquipo.body.consulta.tipo_equipo, 'No identificado');
  assert.equal(sinDatosEquipo.body.consulta.marca, 'No identificado');
  assert.equal(sinDatosEquipo.body.consulta.modelo, 'No identificado');
});
