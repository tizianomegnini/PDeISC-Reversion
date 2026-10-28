import { Router } from 'express';
import { pool } from '../config/db.js';
import { ah, forbidden } from '../utils/errors.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { statsTecnico } from '../services/stats.js';

const router = Router();
router.use(authenticate(), requireRole('tecnico'));

router.get('/resumen', ah(async (req, res) => {
  if (!req.user.tecnico_id) throw forbidden('Su cuenta no tiene perfil de técnico');
  const [t] = await pool.execute(
    `SELECT t.id, t.especialidad, t.limite_consultas, t.habilitado, l.nombre AS local_nombre, l.direccion AS local_direccion
       FROM tecnicos t JOIN locales l ON l.id = t.local_id WHERE t.id = ?`, [req.user.tecnico_id]);
  res.json({ tecnico: t[0], stats: await statsTecnico(req.user.tecnico_id) });
}));

export default router;
