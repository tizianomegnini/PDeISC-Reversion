import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault(); setError(''); setEnviando(true);
    try { await register({ ...form, telefono: form.telefono || null }); toast.ok('Cuenta creada'); navigate('/consultas'); }
    catch (err) { setError(err.message); } finally { setEnviando(false); }
  };
  return (
    <div className="card" style={{ maxWidth: 520, margin: '2rem auto' }}>
      <h1>Crear cuenta de cliente</h1>
      <form onSubmit={enviar} className="stack">
        <label>Nombre<input value={form.nombre} onChange={set('nombre')} required maxLength={80} /></label>
        <label>Apellido<input value={form.apellido} onChange={set('apellido')} required maxLength={80} /></label>
        <label>Email<input type="email" value={form.email} onChange={set('email')} required autoComplete="username" /></label>
        <label>Teléfono (opcional)<input value={form.telefono} onChange={set('telefono')} maxLength={40} /></label>
        <label>Contraseña (mínimo 8, con letras y números)<input type="password" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" /></label>
        {error && <div className="alert error" role="alert">{error}</div>}
        <button disabled={enviando}>{enviando ? 'Creando…' : 'Registrarme'}</button>
      </form>
      <p>¿Ya tiene cuenta? <Link to="/login">Ingresar</Link></p>
    </div>
  );
}
