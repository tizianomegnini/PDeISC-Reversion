import { Router } from 'express';
import { pool } from '../config/db.js';
import { ah } from '../utils/errors.js';
import { parse, schemas } from '../utils/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate(), requireRole('cliente', 'tecnico'));

router.post('/dispositivo', ah(async (req, res) => {
  const { token, plataforma } = parse(schemas.pushToken, req.body);
  await pool.execute(
    `INSERT INTO push_tokens (token, usuario_id, plataforma) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE usuario_id=VALUES(usuario_id), plataforma=VALUES(plataforma), updated_at=CURRENT_TIMESTAMP`,
    [token, req.user.id, plataforma],
  );
  res.status(201).json({ ok: true });
}));

router.delete('/dispositivo', ah(async (req, res) => {
  const { token } = parse(schemas.pushToken.pick({ token: true }), req.body);
  await pool.execute('DELETE FROM push_tokens WHERE token = ? AND usuario_id = ?', [token, req.user.id]);
  res.json({ ok: true });
}));

export default router;
