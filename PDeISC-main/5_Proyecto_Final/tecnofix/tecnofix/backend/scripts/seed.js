import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const LOCALES = [
  { nombre: 'TecnoFix Centro', direccion: 'Av. Colón 1500', ciudad: 'Mar del Plata', telefono: '223 400-0001' },
  { nombre: 'TecnoFix Güemes', direccion: 'Güemes 2800', ciudad: 'Mar del Plata', telefono: '223 400-0002' },
  { nombre: 'TecnoFix Puerto', direccion: 'Av. Martínez de Hoz 900', ciudad: 'Mar del Plata', telefono: '223 400-0003' },
];
const NOMBRES = ['Lucas', 'Martina', 'Joaquín', 'Camila', 'Nicolás'];
const APELLIDOS = ['Pérez', 'Gómez', 'Rossi', 'Fernández', 'Sosa'];
const ESPECIALIDADES = ['Celulares', 'Notebooks', 'PC de escritorio', 'Consolas', 'Tablets'];

const [yaHay] = await pool.execute('SELECT COUNT(*) AS n FROM locales');
if (yaHay[0].n > 0) {
  console.log('La base ya tiene locales: el seed no se vuelve a ejecutar (use npm run db:reset para empezar de cero).');
  await pool.end(); process.exit(0);
}
const gen = () => crypto.randomBytes(9).toString('base64url') + 'a1';
const fija = process.env.SEED_USER_PASSWORD || null;
const creds = [];

async function crearUsuario(rol, nombre, apellido, email, password, debeCambiar) {
  const [r] = await pool.execute(
    'INSERT INTO usuarios (rol, nombre, apellido, email, password_hash, debe_cambiar_password) VALUES (?,?,?,?,?,?)',
    [rol, nombre, apellido, email, await bcrypt.hash(password, env.bcryptRounds), debeCambiar ? 1 : 0]);
  creds.push(`${rol.toUpperCase().padEnd(8)} ${email}  ${password}${debeCambiar ? '  (cambio obligatorio en el primer ingreso)' : ''}`);
  return r.insertId;
}

// Administrador
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@tecnofix.local').toLowerCase();
const adminPw = process.env.ADMIN_PASSWORD || gen();
const [adm] = await pool.execute('SELECT id FROM usuarios WHERE email=?', [adminEmail]);
if (adm[0]) console.log(`El administrador ${adminEmail} ya existía (create-admin); se conserva.`);
else await crearUsuario('admin', 'Administrador', 'TecnoFix', adminEmail, adminPw, !process.env.ADMIN_PASSWORD);

// Locales + 5 técnicos por local
for (const [i, l] of LOCALES.entries()) {
  const [r] = await pool.execute('INSERT INTO locales (nombre, direccion, ciudad, telefono) VALUES (?,?,?,?)', [l.nombre, l.direccion, l.ciudad, l.telefono]);
  for (let k = 0; k < 5; k++) {
    const n = i * 5 + k + 1;
    const uid = await crearUsuario('tecnico', NOMBRES[k], `${APELLIDOS[(k + i) % 5]} ${n}`, `tecnico${n}@tecnofix.local`, fija || gen(), true);
    await pool.execute('INSERT INTO tecnicos (usuario_id, local_id, especialidad, limite_consultas) VALUES (?,?,?,20)', [uid, r.insertId, ESPECIALIDADES[k]]);
  }
}
// Cliente de demostración
await crearUsuario('cliente', 'Cliente', 'Demo', 'cliente@tecnofix.local', fija || gen(), false);

const file = path.resolve('seed-credentials.local.txt');
fs.writeFileSync(file, `Credenciales locales generadas ${new Date().toISOString()}\n(NO subir este archivo a Git; ya está en .gitignore)\n\n${creds.join('\n')}\n`);
console.log(`Seed completado: ${LOCALES.length} locales, ${LOCALES.length * 5} técnicos, 1 admin, 1 cliente demo.`);
console.log(`Credenciales guardadas en: ${file}`);
await pool.end();
