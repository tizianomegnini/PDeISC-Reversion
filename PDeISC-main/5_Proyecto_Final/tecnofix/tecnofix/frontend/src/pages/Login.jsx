import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { homePorRol } from '../components/ProtectedRoute.jsx';
import { authApi } from '../services/api.js';

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  if (user) return <Navigate to={user.debe_cambiar_password ? '/cambiar-password' : homePorRol[user.rol]} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const enviar = async (e) => {
    e.preventDefault(); setError(''); setEnviando(true);
    try {
      const u = await login(form);
      toast.ok(`Bienvenido/a, ${u.nombre}`);
      navigate(u.debe_cambiar_password ? '/cambiar-password' : state?.from || homePorRol[u.rol], { replace: true });
    } catch (err) { setError(err.message); } finally { setEnviando(false); }
  };
  const social = async (p) => {
    try { await authApi.socialStart(p); } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="card" style={{ maxWidth: 460, margin: '2rem auto' }}>
      <h1>Ingresar</h1>
      <form onSubmit={enviar} className="stack">
        <label>Email<input type="email" value={form.email} onChange={set('email')} required autoComplete="username" /></label>
        <label>Contraseña<input type="password" value={form.password} onChange={set('password')} required autoComplete="current-password" /></label>
        {error && <div className="alert error" role="alert">{error}</div>}
        <button disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
      <p>¿No tiene cuenta? <Link to="/registro">Registrarse como cliente</Link></p>
      <hr />
      <p className="muted">Inicio de sesión con redes (pendiente de configuración de los proveedores):</p>
      <div className="row">
        {['google', 'facebook', 'apple'].map((p) => <button key={p} type="button" className="secondary" onClick={() => social(p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}
      </div>
    </div>
  );
}
