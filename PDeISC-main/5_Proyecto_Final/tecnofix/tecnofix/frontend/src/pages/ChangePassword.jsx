import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authApi } from '../services/api.js';
import { homePorRol } from '../components/ProtectedRoute.jsx';

export default function ChangePassword() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ actual: '', nueva: '', repetir: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault(); setError('');
    if (form.nueva !== form.repetir) return setError('Las contraseñas nuevas no coinciden');
    try {
      const r = await authApi.changePassword({ actual: form.actual, nueva: form.nueva });
      setUser(r.usuario); toast.ok('Contraseña actualizada'); navigate(homePorRol[r.usuario.rol]);
    } catch (err) { setError(err.message); }
  };
  return (
    <div className="card" style={{ maxWidth: 520, margin: '2rem auto' }}>
      <h1>Cambiar contraseña</h1>
      {user.debe_cambiar_password && <div className="alert warn">Su contraseña es provisoria: debe cambiarla para continuar.</div>}
      <form onSubmit={enviar} className="stack">
        <label>Contraseña actual<input type="password" value={form.actual} onChange={set('actual')} required autoComplete="current-password" /></label>
        <label>Nueva contraseña (mínimo 8, con letras y números)<input type="password" value={form.nueva} onChange={set('nueva')} required minLength={8} autoComplete="new-password" /></label>
        <label>Repetir nueva contraseña<input type="password" value={form.repetir} onChange={set('repetir')} required autoComplete="new-password" /></label>
        {error && <div className="alert error" role="alert">{error}</div>}
        <button>Guardar contraseña</button>
      </form>
    </div>
  );
}
