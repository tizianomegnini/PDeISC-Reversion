// Middleware que protege rutas: exige un token JWT válido en la cabecera Authorization.
import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization; // formato esperado: "Bearer <token>"

  if (!cabecera || !cabecera.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No se envió token de acceso' });
  }

  const token = cabecera.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o caducado' });
  }
}
