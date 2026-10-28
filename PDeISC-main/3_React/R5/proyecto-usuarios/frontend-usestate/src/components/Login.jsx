import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login({ irA }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorApi, setErrorApi] = useState('');
  const { login } = useAuth();

  async function onSubmit(datos) {
    setErrorApi('');
    try {
      const res = await api.post('/auth/login', datos);
      login(res.data.token, res.data.usuario);
      irA('dashboard');
    } catch (err) {
      setErrorApi(err.response?.data?.error || 'Error al iniciar sesión');
    }
  }

  return (
    <div className="tarjeta">
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Email
          <input type="email" {...register('email', { required: 'El email es obligatorio' })} />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </label>
        <label>
          Contraseña
          <input type="password" {...register('password', { required: 'La contraseña es obligatoria' })} />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </label>
        {errorApi && <p className="error">{errorApi}</p>}
        <button type="submit">Entrar</button>
      </form>
      <p>¿No tenés cuenta? <button className="enlace" onClick={() => irA('register')}>Registrate</button></p>
    </div>
  );
}
