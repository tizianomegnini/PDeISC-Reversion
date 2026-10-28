import './env-test.js';
import { test, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/config/db.js';
import { resetDb, closeDb, registrarCliente, crearTecnico, crearAdmin, crearLocal, login, api, crearConsulta, setValoraciones } from './helpers.js';

let cli, admTok;

before(async () => { await resetDb(); admTok = await login((await crearAdmin()).email); });
after(closeDb);
beforeEach(async () => {
  // Cada prueba arranca sin técnicos ni consultas previas (los usuarios/clientes se conservan)
  await pool.query('DELETE FROM valoraciones'); await pool.query('DELETE FROM mensajes'); await pool.query('DELETE FROM consultas');
  await pool.query('DELETE FROM tecnicos');
  cli = await registrarCliente();
});

test('se asigna primero al técnico con menor puntaje de valoración', async () => {
  const bajo = await crearTecnico(); const alto = await crearTecnico();
  await setValoraciones(bajo.tecnicoId, [3, 3, 3, 3, 3, 3]);
  await setValoraciones(alto.tecnicoId, [5, 5, 5, 5, 5, 5]);
  const c = await crearConsulta(cli.token);
  assert.equal(c.estado, 'asignada');
  assert.equal(c.tecnico_id, bajo.tecnicoId);
  assert.ok(c.local_nombre, 'el cliente ve el local asignado');
  assert.ok(c.tecnico_nombre, 'el cliente ve el técnico asignado');
});

test('con igual valoración gana el que tiene menos consultas activas', async () => {
  const a = await crearTecnico(); const b = await crearTecnico();
  await setValoraciones(a.tecnicoId, [4, 4]); await setValoraciones(b.tecnicoId, [4, 4]);
  const c1 = await crearConsulta(cli.token);
  const c2 = await crearConsulta(cli.token);
  assert.notEqual(c1.tecnico_id, c2.tecnico_id, 'se reparten porque el primero ya tiene una activa');
});

test('un técnico sin valoraciones parte de un puntaje neutro (4.0)', async () => {
  const nuevo = await crearTecnico(); const malo = await crearTecnico(); const bueno = await crearTecnico();
  await setValoraciones(malo.tecnicoId, [2, 2, 2, 2, 2]);   // puntaje < 4
  await setValoraciones(bueno.tecnicoId, [5, 5, 5, 5, 5]);  // puntaje = 4.5
  await pool.execute('UPDATE tecnicos SET limite_consultas=1 WHERE id=?', [malo.tecnicoId]);
  const c1 = await crearConsulta(cli.token);
  assert.equal(c1.tecnico_id, malo.tecnicoId, 'quien tiene menor puntaje recibe primero la oportunidad');
  // Al agotarse el cupo del técnico con menor puntaje, el nuevo (4.0) queda antes que el de 4.5.
  await pool.execute('UPDATE tecnicos SET limite_consultas=1 WHERE id=?', [bueno.tecnicoId]);
  const c2 = await crearConsulta(cli.token);
  assert.equal(c2.tecnico_id, nuevo.tecnicoId);
});

test('el límite por técnico se respeta y se pasa al siguiente disponible', async () => {
  const a = await crearTecnico({ limite: 2 }); const b = await crearTecnico({ limite: 2 });
  await setValoraciones(a.tecnicoId, [5, 5, 5]);
  const res = [];
  for (let i = 0; i < 4; i++) res.push(await crearConsulta(cli.token));
  const porTec = (id) => res.filter((r) => r.tecnico_id === id).length;
  assert.equal(porTec(a.tecnicoId), 2);
  assert.equal(porTec(b.tecnicoId), 2);
  assert.ok(res.every((r) => r.estado === 'asignada'));
});

test('sin capacidad la consulta queda pendiente y se puede reintentar', async () => {
  const t = await crearTecnico({ limite: 1 });
  const c1 = await crearConsulta(cli.token);
  const c2 = await crearConsulta(cli.token);
  assert.equal(c1.estado, 'asignada');
  assert.equal(c2.estado, 'pendiente');
  assert.equal(c2.tecnico_id, null);
  const pend = (await api(admTok).get('/admin/consultas/pendientes')).body.consultas;
  assert.deepEqual(pend.map((p) => p.id), [c2.id]);
  // Reintentar sin cupo no cambia nada
  const r1 = await api(admTok).post(`/admin/consultas/${c2.id}/asignar`);
  assert.equal(r1.body.asignada, false);
  // El admin sube el límite => se asigna al reintentar
  await api(admTok).put(`/admin/tecnicos/${t.tecnicoId}`).send({ limite_consultas: 2 }).expect(200);
  const c2b = (await api(cli.token).get(`/consultas/${c2.id}`)).body.consulta;
  assert.equal(c2b.estado, 'asignada', 'al aumentar el límite se reintenta automáticamente');
});

test('finalizar una consulta libera el cupo y asigna la pendiente', async () => {
  const t = await crearTecnico({ limite: 1 });
  const tok = await login(t.email);
  const c1 = await crearConsulta(cli.token);
  const c2 = await crearConsulta(cli.token);
  assert.equal(c2.estado, 'pendiente');
  await api(tok).patch(`/consultas/${c1.id}/estado`).send({ estado: 'en_proceso' }).expect(200);
  await api(tok).patch(`/consultas/${c1.id}/estado`).send({ estado: 'finalizada' }).expect(200);
  const c2b = (await api(cli.token).get(`/consultas/${c2.id}`)).body.consulta;
  assert.equal(c2b.estado, 'asignada');
  assert.equal(c2b.tecnico_id, t.tecnicoId);
});

test('cancelar también libera cupo; esperando_cliente sigue consumiéndolo', async () => {
  const t = await crearTecnico({ limite: 1 });
  const tok = await login(t.email);
  const c1 = await crearConsulta(cli.token);
  await api(tok).patch(`/consultas/${c1.id}/estado`).send({ estado: 'en_proceso' }).expect(200);
  await api(tok).patch(`/consultas/${c1.id}/estado`).send({ estado: 'esperando_cliente' }).expect(200);
  const c2 = await crearConsulta(cli.token);
  assert.equal(c2.estado, 'pendiente', 'esperando_cliente consume cupo');
  await api(cli.token).patch(`/consultas/${c1.id}/estado`).send({ estado: 'cancelada' }).expect(200);
  assert.equal((await api(cli.token).get(`/consultas/${c2.id}`)).body.consulta.estado, 'asignada');
});

test('técnicos deshabilitados, desactivados o de locales inactivos no reciben consultas', async () => {
  const off = await crearTecnico(); const inactivoU = await crearTecnico(); const localOff = await crearTecnico();
  await pool.execute('UPDATE tecnicos SET habilitado=0 WHERE id=?', [off.tecnicoId]);
  await pool.execute('UPDATE usuarios SET activo=0 WHERE id=?', [inactivoU.usuarioId]);
  await pool.execute('UPDATE locales SET activo=0 WHERE id=?', [localOff.localId]);
  assert.equal((await crearConsulta(cli.token)).estado, 'pendiente');
  const ok = await crearTecnico();
  await api(admTok).post('/admin/consultas/reintentar').expect(200);
  const lista = (await api(cli.token).get('/consultas')).body.consultas;
  assert.equal(lista[0].tecnico_id, ok.tecnicoId);
});

test('desactivar un técnico devuelve sus consultas activas a la cola y las reasigna', async () => {
  const a = await crearTecnico(); const b = await crearTecnico();
  await setValoraciones(a.tecnicoId, [2, 2, 2, 2]);
  const c = await crearConsulta(cli.token);
  assert.equal(c.tecnico_id, a.tecnicoId);
  await api(admTok).post(`/admin/tecnicos/${a.tecnicoId}/estado`).send({ activo: false }).expect(200);
  const c2 = (await api(cli.token).get(`/consultas/${c.id}`)).body.consulta;
  assert.equal(c2.tecnico_id, b.tecnicoId);
});

test('CONCURRENCIA: 12 consultas simultáneas nunca superan el límite (límite 3 + 2 = 5 cupos)', async () => {
  const a = await crearTecnico({ limite: 3 }); const b = await crearTecnico({ limite: 2 });
  const clientes = await Promise.all(Array.from({ length: 12 }, () => registrarCliente()));
  const resultados = await Promise.all(clientes.map((c) => api(c.token).post('/consultas').send({ tipo_equipo: 'PC', marca: 'HP', modelo: 'Pavilion', descripcion: 'Se reinicia sola al jugar' })));
  assert.ok(resultados.every((r) => r.status === 201), JSON.stringify(resultados.find((r) => r.status !== 201)?.body));
  const [filas] = await pool.query(
    `SELECT tecnico_id, COUNT(*) AS n FROM consultas WHERE estado IN ('asignada','en_proceso','esperando_cliente') GROUP BY tecnico_id`);
  const n = Object.fromEntries(filas.map((f) => [f.tecnico_id, Number(f.n)]));
  assert.equal(n[a.tecnicoId], 3);
  assert.equal(n[b.tecnicoId], 2);
  const [pend] = await pool.query("SELECT COUNT(*) AS n FROM consultas WHERE estado='pendiente'");
  assert.equal(Number(pend[0].n), 7);
});

test('el límite por defecto es 20 y el administrador puede cambiarlo', async () => {
  const loc = await crearLocal();
  const r = await api(admTok).post('/admin/tecnicos').send({ nombre: 'Def', apellido: 'Ault', email: `def${Date.now()}@test.local`, local_id: loc });
  const lista = (await api(admTok).get('/admin/tecnicos')).body.tecnicos;
  assert.equal(lista.find((t) => t.id === r.body.id).limite_consultas, 20);
  assert.equal((await api(admTok).put('/admin/configuracion').send({ limite_consultas_default: 15 })).status, 200);
  const r2 = await api(admTok).post('/admin/tecnicos').send({ nombre: 'Def', apellido: 'Dos', email: `def2${Date.now()}@test.local`, local_id: loc });
  assert.equal((await api(admTok).get('/admin/tecnicos')).body.tecnicos.find((t) => t.id === r2.body.id).limite_consultas, 15);
  assert.equal((await api(admTok).put(`/admin/tecnicos/${r.body.id}`).send({ limite_consultas: 7 })).status, 200);
  assert.equal((await api(admTok).get('/admin/tecnicos')).body.tecnicos.find((t) => t.id === r.body.id).limite_consultas, 7);
});
