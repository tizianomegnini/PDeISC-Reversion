import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config.js';
import { verificarToken } from '../middleware/auth.js';
import { listaProveedores, iniciarOAuth, callbackOAuth, intercambiar } from '../oauth.js';

const router = Router();

// ---------- Validaciones ----------
// Cada función devuelve { valor } si está bien, o { error } si no.
// Antes solo se comprobaba que el campo "existiera": un nombre "   ", un
// nombre enviado como objeto o un email "hola" pasaban sin problema.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarNombre(nombre) {
  if (typeof nombre !== 'string') return { error: 'El nombre debe ser texto' };
  const valor = nombre.trim();
  if (!valor) return { error: 'El nombre es obligatorio' };
  if (valor.length > 100) return { error: 'El nombre no puede superar los 100 caracteres' };
  return { valor };
}

function validarEmail(email) {
  if (typeof email !== 'string') return { error: 'El email debe ser texto' };
  const valor = email.trim().toLowerCase();
  if (!valor) return { error: 'El email es obligatorio' };
  if (valor.length > 150) return { error: 'El email no puede superar los 150 caracteres' };
  if (!EMAIL_RE.test(valor)) return { error: 'El email no es válido' };
  return { valor };
}

function validarPassword(password) {
  if (typeof password !== 'string') return { error: 'La contraseña debe ser texto' };
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres' };
  // bcrypt ignora en silencio todo lo que pase de 72 bytes: mejor avisar.
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return { error: 'La contraseña es demasiado larga (máximo 72 caracteres)' };
  }
  return { valor: password };
}

export function firmarToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Hash "de mentira" para que el login tarde lo mismo exista o no el email
// (evita que se pueda averiguar qué emails están registrados midiendo tiempos).
const HASH_FALSO = bcrypt.hashSync('contraseña-que-nadie-usa', 10);

// ---------- Registro ----------
router.get('/oauth/providers', (req, res) => {
  res.json({ proveedores: listaProveedores() });
});

router.get('/oauth/:provider', (req, res) => iniciarOAuth(req.params.provider, req, res));
router.get('/oauth/:provider/callback', (req, res) => callbackOAuth(req.params.provider, req, res));

router.post('/oauth/exchange', (req, res) => {
  const codigo = typeof req.body?.code === 'string' ? req.body.code : '';
  const token = intercambiar(codigo);
  if (!token) return res.status(400).json({ error: 'Código OAuth inválido o vencido' });
  return res.json({ token });
});

router.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body ?? {};

  const n = validarNombre(nombre);
  if (n.error) return res.status(400).json({ error: n.error });
  const e = validarEmail(email);
  if (e.error) return res.status(400).json({ error: e.error });
  const p = validarPassword(password);
  if (p.error) return res.status(400).json({ error: p.error });

  try {
    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [e.valor]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }

    // Nunca se guarda la contraseña en texto plano
    const hash = await bcrypt.hash(p.valor, 10);

    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)',
      [n.valor, e.valor, hash]
    );

    res.status(201).json({
      token: firmarToken(resultado.insertId),
      usuario: { id: resultado.insertId, nombre: n.valor, email: e.valor },
    });
  } catch (err) {
    // Dos registros simultáneos con el mismo email pasan el SELECT de arriba;
    // el segundo choca con el UNIQUE de la tabla. Es un 409, no un 500.
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

// ---------- Login ----------
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const [filas] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [
      email.trim().toLowerCase(),
    ]);
    const usuario = filas[0];

    const coincide = await bcrypt.compare(password, usuario?.password_hash || HASH_FALSO);
    if (!usuario || !coincide) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    res.json({
      token: firmarToken(usuario.id),
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// ---------- Usuario actual (para restaurar sesión al recargar) ----------
router.get('/me', verificarToken, async (req, res) => {
  try {
    const [filas] = await pool.query(
      'SELECT id, nombre, email, creado_en FROM usuarios WHERE id = ?',
      [req.usuarioId]
    );
    const usuario = filas[0];
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// ---------- Editar perfil (protegida) ----------
router.put('/me', verificarToken, async (req, res) => {
  const n = validarNombre(req.body?.nombre);
  if (n.error) return res.status(400).json({ error: n.error });

  try {
    await pool.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [n.valor, req.usuarioId]);

    const [filas] = await pool.query(
      'SELECT id, nombre, email, creado_en FROM usuarios WHERE id = ?',
      [req.usuarioId]
    );
    if (filas.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Devolvemos el usuario ya guardado (con el nombre limpio) para que el
    // front muestre exactamente lo que quedó en la base.
    res.json({ mensaje: 'Perfil actualizado', usuario: filas[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

export default router;
