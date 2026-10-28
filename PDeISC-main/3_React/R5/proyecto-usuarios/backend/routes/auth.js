import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }

    // Nunca se guarda la contraseña en texto plano
    const hash = await bcrypt.hash(password, 10);

    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)',
      [nombre, email, hash]
    );

    const token = jwt.sign({ id: resultado.insertId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      token,
      usuario: { id: resultado.insertId, nombre, email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const [filas] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const usuario = filas[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Devuelve el usuario logueado a partir del token (para restaurar sesión al recargar)
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

// Editar perfil (protegida)
router.put('/me', verificarToken, async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    await pool.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, req.usuarioId]);
    res.json({ mensaje: 'Perfil actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

export default router;
