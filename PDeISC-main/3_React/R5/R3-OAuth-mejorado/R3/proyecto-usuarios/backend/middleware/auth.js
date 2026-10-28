// Middleware que protege rutas: exige un token JWT válido en la cabecera Authorization.
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization; // formato esperado: "Bearer <token>"

  if (!cabecera || !cabecera.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No se envió token de acceso' });
  }

  const token = cabecera.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuarioId = payload.id;
    next();
  } catch (err) {
    const caducado = err.name === 'TokenExpiredError';
    return res.status(401).json({
      error: caducado ? 'Tu sesión expiró, iniciá sesión de nuevo' : 'Token inválido',
    });
  }
}
