import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api, { mensajeDeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { reglaEmail } from '../validaciones';

export default function Login({ irA }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [errorApi, setErrorApi] = useState('');
  const { login, aviso } = useAuth();

  async function onSubmit(datos) {
    setErrorApi('');
    try {
      const res = await api.post('/auth/login', datos);
      login(res.data.token, res.data.usuario);
      irA('dashboard');
    } catch (err) {
      setErrorApi(mensajeDeError(err, 'Error al iniciar sesión'));
    }
  }

  return (
    <div className="tarjeta">
      <h1>Iniciar sesión</h1>
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
      <p>¿No tenés cuenta? <button type="button" className="enlace" onClick={() => irA('register')}>Registrate</button></p>
    </div>
  );
}
