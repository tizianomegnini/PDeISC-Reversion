import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api, { mensajeDeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { reglaEmail } from '../validaciones';
import SocialLogin from '../components/SocialLogin';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [errorApi, setErrorApi] = useState('');
  const { login, aviso } = useAuth();
  const navigate = useNavigate();

  const oauthError = new URLSearchParams(window.location.search).get('oauth_error');

  async function onSubmit(datos) {
    setErrorApi('');
    try {
      const res = await api.post('/auth/login', datos);
      login(res.data.token, res.data.usuario);
      navigate('/dashboard');
    } catch (err) {
      setErrorApi(mensajeDeError(err, 'Error al iniciar sesión'));
    }
  }

  return (
    <div className="tarjeta">
      <h1>Iniciar sesión</h1>
      {oauthError && <p className="error" role="alert">{oauthError}</p>}
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Email
          <input type="email" autoComplete="email" {...register('email', reglaEmail)} />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            {...register('password', { required: 'La contraseña es obligatoria' })}
          />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </label>
        {errorApi && <p className="error" role="alert">{errorApi}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <SocialLogin />
      <p>¿No tenés cuenta? <Link to="/register">Registrate</Link></p>
    </div>
  );
}
