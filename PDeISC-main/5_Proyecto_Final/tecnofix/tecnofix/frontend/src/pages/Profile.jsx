import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authApi } from '../services/api.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ nombre: user.nombre, apellido: user.apellido, telefono: user.telefono || '' });
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true);
    try { const r = await authApi.updateProfile({ ...form, telefono: form.telefono || null }); setUser(r.usuario); toast.ok('Datos actualizados'); }
    catch (err) { toast.error(err.message); } finally { setGuardando(false); }
  };
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h1>Mis datos</h1>
      <form onSubmit={guardar} className="stack">
        <label>Email<input value={user.email} disabled /></label>
        <label>Nombre<input value={form.nombre} onChange={set('nombre')} required maxLength={80} /></label>
        <label>Apellido<input value={form.apellido} onChange={set('apellido')} required maxLength={80} /></label>
        <label>Teléfono<input value={form.telefono} onChange={set('telefono')} maxLength={40} /></label>
        <button disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
      </form>
      <p><Link to="/cambiar-password">Cambiar contraseña</Link></p>
    </div>
  );
}
