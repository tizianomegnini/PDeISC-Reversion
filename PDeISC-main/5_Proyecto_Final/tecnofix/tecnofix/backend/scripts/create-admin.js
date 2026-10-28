import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const email = (process.env.ADMIN_EMAIL || 'admin@tecnofix.local').toLowerCase();
const provista = process.env.ADMIN_PASSWORD;
const password = provista || crypto.randomBytes(9).toString('base64url') + 'a1';
const [ex] = await pool.execute('SELECT id FROM usuarios WHERE email=?', [email]);
if (ex[0]) {
  console.log(`El administrador ${email} ya existe. No se modificó.`);
} else {
  const hash = await bcrypt.hash(password, env.bcryptRounds);
  await pool.execute(
    "INSERT INTO usuarios (rol, nombre, apellido, email, password_hash, debe_cambiar_password) VALUES ('admin','Administrador','TecnoFix',?,?,?)",
    [email, hash, provista ? 0 : 1]);
  console.log(`Administrador creado: ${email}`);
  if (!provista) {
    const f = path.resolve('seed-credentials.local.txt');
    fs.appendFileSync(f, `ADMIN  ${email}  ${password}  (debe cambiarla al ingresar)\n`);
    console.log(`Contraseña inicial guardada en ${f}`);
  }
}
await pool.end();
