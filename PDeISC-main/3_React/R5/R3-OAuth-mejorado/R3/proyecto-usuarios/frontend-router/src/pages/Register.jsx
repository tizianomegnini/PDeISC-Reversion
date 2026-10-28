import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api, { mensajeDeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { reglaEmail, reglaNombre } from '../validaciones';
import SocialLogin from '../components/SocialLogin';

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [errorApi, setErrorApi] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(datos) {
    setErrorApi('');
    try {
      const res = await api.post('/auth/register', datos);
      login(res.data.token, res.data.usuario);
      navigate('/dashboard');
    } catch (err) {
      setErrorApi(mensajeDeError(err, 'Error al registrarse'));
    }
  }

  return (
    <div className="tarjeta">
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Nombre
          <input autoComplete="name" {...register('nombre', reglaNombre)} />
          {errors.nombre && <span className="error">{errors.nombre.message}</span>}
        </label>
        <label>
          Email
          <input type="email" autoComplete="email" {...register('email', reglaEmail)} />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete="new-password"
            {...register('password', {
              required: 'La contraseña es obligatoria',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              maxLength: { value: 72, message: 'Máximo 72 caracteres' },
            })}
          />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </label>
        {errorApi && <p className="error" role="alert">{errorApi}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Registrarme'}
        </button>
      </form>
      <SocialLogin />
      <p>¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></p>
    </div>
  );
}
