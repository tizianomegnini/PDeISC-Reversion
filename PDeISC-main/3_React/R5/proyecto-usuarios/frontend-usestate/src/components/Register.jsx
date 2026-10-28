import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register({ irA }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorApi, setErrorApi] = useState('');
  const { login } = useAuth();

  async function onSubmit(datos) {
    setErrorApi('');
    try {
      const res = await api.post('/auth/register', datos);
      login(res.data.token, res.data.usuario);
      irA('dashboard');
    } catch (err) {
      setErrorApi(err.response?.data?.error || 'Error al registrarse');
    }
  }

  return (
    <div className="tarjeta">
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Nombre
          <input {...register('nombre', { required: 'El nombre es obligatorio' })} />
          {errors.nombre && <span className="error">{errors.nombre.message}</span>}
        </label>
        <label>
          Email
          <input type="email" {...register('email', { required: 'El email es obligatorio' })} />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </label>
        <label>
          Contraseña
          <input type="password" {...register('password', {
            required: 'La contraseña es obligatoria',
            minLength: { value: 6, message: 'Mínimo 6 caracteres' },
          })} />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </label>
        {errorApi && <p className="error">{errorApi}</p>}
        <button type="submit">Registrarme</button>
      </form>
      <p>¿Ya tenés cuenta? <button className="enlace" onClick={() => irA('login')}>Iniciá sesión</button></p>
    </div>
  );
}
