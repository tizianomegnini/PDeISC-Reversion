import { HttpError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, detalles: err.details });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  if (err?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
  if (!env.isTest) console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
