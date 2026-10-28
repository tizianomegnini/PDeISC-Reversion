import './env-test.js';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { initDatabase } from '../scripts/lib.js';

export const app = createApp();
export const API = '/api/v1';
export const PASSWORD = 'Prueba1234';
let seq = 0;

export async function resetDb() {
  // Seguro extra: jamás borrar una base que no sea de pruebas.
  if (!/_test$/.test(env.db.database)) throw new Error(`Se niega a borrar la base "${env.db.database}": el nombre de la base de pruebas debe terminar en _test`);
  await initDatabase({ drop: true });
}
export async function closeDb() { await pool.end(); }

export async function crearLocal(nombre = `Local ${++seq}`) {
  const [r] = await pool.execute('INSERT INTO locales (nombre, direccion, ciudad) VALUES (?,?,?)', [nombre, 'Calle 123', 'Mar del Plata']);
  return r.insertId;
}

/** Crea técnico directo en la base. Devuelve { tecnicoId, usuarioId, email }. */
export async function crearTecnico({ localId, limite = 20, email, debeCambiar = 0 } = {}) {
  localId ??= await crearLocal();
  email ??= `tec${++seq}@test.local`;
  const hash = await bcrypt.hash(PASSWORD, 4);
  const [u] = await pool.execute("INSERT INTO usuarios (rol,nombre,apellido,email,password_hash,debe_cambiar_password) VALUES ('tecnico','Tec','Nico',?,?,?)", [email, hash, debeCambiar]);
  const [t] = await pool.execute('INSERT INTO tecnicos (usuario_id, local_id, limite_consultas) VALUES (?,?,?)', [u.insertId, localId, limite]);
  return { tecnicoId: t.insertId, usuarioId: u.insertId, email, localId };
}

export async function crearAdmin(email = `admin${++seq}@test.local`) {
  const hash = await bcrypt.hash(PASSWORD, 4);
  const [u] = await pool.execute("INSERT INTO usuarios (rol,nombre,apellido,email,password_hash) VALUES ('admin','Ad','Min',?,?)", [email, hash]);
  return { usuarioId: u.insertId, email };
}

export async function registrarCliente(email = `cli${++seq}@test.local`) {
  const r = await request(app).post(`${API}/auth/register`).set('X-Client', 'mobile')
    .send({ nombre: 'Cli', apellido: 'Ente', email, password: PASSWORD });
  if (r.status !== 201) throw new Error('registro falló: ' + JSON.stringify(r.body));
  return { token: r.body.token, id: r.body.usuario.id, email };
}

export async function login(email, password = PASSWORD) {
  const r = await request(app).post(`${API}/auth/login`).set('X-Client', 'mobile').send({ email, password });
  if (r.status !== 200) throw new Error(`login falló (${r.status}): ` + JSON.stringify(r.body));
  return r.body.token;
}

/** Atajo: api(token).get(url) / .post(url).send(...) con el header Bearer ya puesto */
export const api = (token) => {
  const wrap = (method) => (url) => {
    const r = request(app)[method](`${API}${url}`);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };
  return { get: wrap('get'), post: wrap('post'), put: wrap('put'), patch: wrap('patch'), delete: wrap('delete') };
};

export const consultaBody = (extra = {}) => ({
  tipo_equipo: 'Notebook', marca: 'Lenovo', modelo: 'IdeaPad 3', descripcion: 'No enciende y el cargador parece funcionar.', ...extra,
});

export async function crearConsulta(token, extra) {
  const r = await api(token).post('/consultas').send(consultaBody(extra));
  if (r.status !== 201) throw new Error('crear consulta falló: ' + JSON.stringify(r.body));
  return r.body.consulta;
}

export async function setValoraciones(tecnicoId, estrellasList) {
  // Inserta valoraciones "históricas" (con consultas finalizadas) para armar escenarios de ranking.
  const cli = await registrarCliente();
  for (const e of estrellasList) {
    const [c] = await pool.execute("INSERT INTO consultas (cliente_id, tecnico_id, tipo_equipo, marca, modelo, descripcion, estado) VALUES (?,?,?,?,?,?, 'finalizada')",
      [cli.id, tecnicoId, 'PC', 'X', 'Y', 'historial de prueba']);
    await pool.execute('INSERT INTO valoraciones (consulta_id, cliente_id, tecnico_id, estrellas) VALUES (?,?,?,?)', [c.insertId, cli.id, tecnicoId, e]);
  }
}
