import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api, { mensajeDeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { reglaNombre } from '../validaciones';

export default function Profile() {
  const { usuario, setUsuario } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { nombre: usuario?.nombre || '' },
  });
  // { tipo: 'exito' | 'error', texto: string } | null
  const [estado, setEstado] = useState(null);

  async function onSubmit(datos) {
    setEstado(null);
    try {
      const res = await api.put('/auth/me', datos);
      // Usamos lo que quedó guardado en el servidor (ya con el nombre limpio)
      setUsuario({ ...usuario, ...res.data.usuario });
      setEstado({ tipo: 'exito', texto: 'Perfil actualizado correctamente' });
    } catch (err) {
      setEstado({ tipo: 'error', texto: mensajeDeError(err, 'Error al actualizar') });
    }
  }

  return (
    <div className="tarjeta">
      <h1>Mi perfil</h1>
      <p>Email: {usuario?.email} (no editable)</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Nombre
          <input autoComplete="name" {...register('nombre', reglaNombre)} />
          {errors.nombre && <span className="error">{errors.nombre.message}</span>}
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
      {estado && (
        <p className={estado.tipo} role={estado.tipo === 'error' ? 'alert' : 'status'}>
          {estado.texto}
        </p>
      )}
    </div>
  );
}
