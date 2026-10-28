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
  const location = useLocation();
  const { state } = location;
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const socialErrors = {
    google_cancelled: 'Cancelaste el inicio de sesión con Google.',
    google_email_unverified: 'Google necesita confirmar tu dirección de correo.',
    account_unavailable: 'Esta cuenta está desactivada o ya no está disponible.',
    account_provider_mismatch: 'Este correo ya está asociado a otro método de inicio de sesión.',
    google_state_invalid: 'La solicitud de inicio de sesión venció o no es válida. Intentá nuevamente.',
    google_failed: 'No se pudo iniciar sesión con Google. Intentá nuevamente.',
    facebook_cancelled: 'Cancelaste el inicio de sesión con Facebook.',
    facebook_email_missing: 'Facebook no compartió un correo. Revisá los permisos de la app o probá con otra cuenta.',
    facebook_account_exists: 'Ya existe una cuenta con ese correo. Ingresá con tu método habitual; no vinculamos cuentas automáticamente.',
    facebook_state_invalid: 'La solicitud de inicio de sesión venció o no es válida. Intentá nuevamente.',
    facebook_failed: 'No se pudo iniciar sesión con Facebook. Intentá nuevamente.',
    github_cancelled: 'Cancelaste el inicio de sesión con GitHub.',
    github_email_missing: 'No encontramos un correo principal verificado en tu cuenta de GitHub. Agregá y verificá un correo en GitHub e intentá de nuevo.',
    github_account_exists: 'Ya existe una cuenta con ese correo vinculada a otro método. Ingresá con tu método habitual.',
    github_state_invalid: 'La solicitud de inicio de sesión venció o no es válida. Intentá nuevamente.',
    github_failed: 'No se pudo iniciar sesión con GitHub. Intentá nuevamente.',
  };
  const socialError = socialErrors[new URLSearchParams(location.search).get('social_error')];
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
      {socialError && <div className="alert error" role="alert">{socialError}</div>}
      <form onSubmit={enviar} className="stack">
        <label>Email<input type="email" value={form.email} onChange={set('email')} required autoComplete="username" /></label>
        <label>Contraseña<input type="password" value={form.password} onChange={set('password')} required autoComplete="current-password" /></label>
        {error && <div className="alert error" role="alert">{error}</div>}
        <button disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
      <p>¿No tiene cuenta? <Link to="/registro">Registrarse como cliente</Link></p>
      <hr />
      <p className="muted">También podés ingresar con Google, Facebook o GitHub:</p>
      <div className="row">
        {['google', 'facebook', 'github'].map((p) => <button key={p} type="button" className="secondary" onClick={() => social(p)}>{p === 'github' ? 'GitHub' : p[0].toUpperCase() + p.slice(1)}</button>)}
      </div>
    </div>
  );
}
