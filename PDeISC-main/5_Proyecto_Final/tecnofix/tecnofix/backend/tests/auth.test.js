import './env-test.js';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app, API, PASSWORD, resetDb, closeDb, registrarCliente, crearTecnico, login, api } from './helpers.js';
import { pool } from '../src/config/db.js';

before(resetDb);
after(closeDb);

test('registro crea un cliente, guarda el hash bcrypt y nunca la contraseña', async () => {
  const r = await request(app).post(`${API}/auth/register`).send({ nombre: 'Ana', apellido: 'Paz', email: 'Ana@Test.local', password: PASSWORD });
  assert.equal(r.status, 201);
  assert.equal(r.body.usuario.rol, 'cliente');
  assert.equal(r.body.usuario.email, 'ana@test.local');
  assert.equal(r.body.token, undefined, 'la web no recibe el token en el cuerpo (va en cookie httpOnly)');
  assert.match(r.headers['set-cookie'][0], /HttpOnly/i);
  const [rows] = await pool.execute('SELECT password_hash, rol FROM usuarios WHERE email=?', ['ana@test.local']);
  assert.notEqual(rows[0].password_hash, PASSWORD);
  assert.ok(await bcrypt.compare(PASSWORD, rows[0].password_hash));
});

test('registro valida datos y rechaza email duplicado', async () => {
  const base = { nombre: 'Ana', apellido: 'Paz', email: 'dup@test.local', password: PASSWORD };
  assert.equal((await request(app).post(`${API}/auth/register`).send({ ...base, email: 'no-es-email' })).status, 400);
  assert.equal((await request(app).post(`${API}/auth/register`).send({ ...base, password: 'corta1' })).status, 400);
  assert.equal((await request(app).post(`${API}/auth/register`).send({ ...base, password: 'sinnumeros' })).status, 400);
  assert.equal((await request(app).post(`${API}/auth/register`).send(base)).status, 201);
  assert.equal((await request(app).post(`${API}/auth/register`).send(base)).status, 409);
});

test('no se puede registrar un técnico o admin eligiendo el rol', async () => {
  const r = await request(app).post(`${API}/auth/register`).send({ nombre: 'X', apellido: 'Y', email: 'rol@test.local', password: PASSWORD, rol: 'admin' });
  assert.equal(r.status, 201);
  assert.equal(r.body.usuario.rol, 'cliente');
});

test('login correcto, incorrecto y usuario inexistente', async () => {
  const c = await registrarCliente('login@test.local');
  assert.ok(await login('login@test.local'));
  const mobile = await request(app).post(`${API}/auth/login`).set('X-Client', 'mobile')
    .send({ email: 'login@test.local', password: PASSWORD });
  assert.equal(mobile.status, 200);
  assert.ok(mobile.body.token, 'la app móvil recibe un token para Authorization: Bearer');
  assert.equal((await request(app).post(`${API}/auth/login`).send({ email: 'login@test.local', password: 'Incorrecta1' })).status, 401);
  assert.equal((await request(app).post(`${API}/auth/login`).send({ email: 'nadie@test.local', password: PASSWORD })).status, 401);
  assert.ok(c.token);
});

test('sin token, token inválido o cuenta desactivada => 401', async () => {
  assert.equal((await api().get('/auth/me')).status, 401);
  assert.equal((await api('token.falso.xx').get('/auth/me')).status, 401);
  const c = await registrarCliente('baja@test.local');
  assert.equal((await api(c.token).get('/auth/me')).status, 200);
  await pool.execute('UPDATE usuarios SET activo=0 WHERE id=?', [c.id]);
  assert.equal((await api(c.token).get('/auth/me')).status, 401, 'un token válido deja de servir si la cuenta se desactiva');
  assert.equal((await request(app).post(`${API}/auth/login`).send({ email: 'baja@test.local', password: PASSWORD })).status, 401);
});

test('cookie de sesión: GET funciona, pero modificar exige X-Requested-With (anti CSRF)', async () => {
  const agent = request.agent(app);
  await agent.post(`${API}/auth/register`).send({ nombre: 'Co', apellido: 'Okie', email: 'cookie@test.local', password: PASSWORD }).expect(201);
  await agent.get(`${API}/auth/me`).expect(200);
  await agent.put(`${API}/auth/me`).send({ nombre: 'Nuevo', apellido: 'Nombre' }).expect(403);
  await agent.put(`${API}/auth/me`).set('X-Requested-With', 'tecnofix').send({ nombre: 'Nuevo', apellido: 'Nombre' }).expect(200);
  await agent.post(`${API}/auth/logout`).expect(200);
  await agent.get(`${API}/auth/me`).expect(401);
});

test('editar perfil y cambiar contraseña', async () => {
  const c = await registrarCliente('perfil@test.local');
  const e = await api(c.token).put('/auth/me').send({ nombre: 'Nuevo', apellido: 'Apellido', telefono: '223 555-1234' });
  assert.equal(e.status, 200);
  assert.equal(e.body.usuario.nombre, 'Nuevo');
  assert.equal((await api(c.token).post('/auth/change-password').send({ actual: 'mal', nueva: 'Nueva12345' })).status, 400);
  assert.equal((await api(c.token).post('/auth/change-password').send({ actual: PASSWORD, nueva: 'Nueva12345' })).status, 200);
  assert.ok(await login('perfil@test.local', 'Nueva12345'));
});

test('credenciales iniciales: se exige cambiar la contraseña antes de usar la API', async () => {
  const t = await crearTecnico({ email: 'inicial@test.local', debeCambiar: 1 });
  const token = await login(t.email);
  assert.equal((await api(token).get('/consultas')).status, 403);
  assert.equal((await api(token).get('/auth/me')).status, 200);
  assert.equal((await api(token).post('/auth/change-password').send({ actual: PASSWORD, nueva: 'OtraClave123' })).status, 200);
  assert.equal((await api(token).get('/consultas')).status, 200);
});

test('login social: responde 501 pendiente de configuración, no simula éxito', async () => {
  const r = await request(app).get(`${API}/auth/social/google`);
  assert.equal(r.status, 501);
  assert.match(r.body.error, /pendiente de configuración/i);
  assert.equal((await request(app).get(`${API}/auth/social/otro`)).status, 404);
});
