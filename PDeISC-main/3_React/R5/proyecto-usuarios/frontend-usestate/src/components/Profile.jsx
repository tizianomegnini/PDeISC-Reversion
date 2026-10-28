import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { usuario, setUsuario } = useAuth();
  const { register, handleSubmit } = useForm({ defaultValues: { nombre: usuario?.nombre || '' } });
  const [mensaje, setMensaje] = useState('');

  async function onSubmit(datos) {
    setMensaje('');
    try {
      await api.put('/auth/me', datos);
      setUsuario({ ...usuario, nombre: datos.nombre });
      setMensaje('Perfil actualizado correctamente');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al actualizar');
    }
  }

  return (
    <div className="tarjeta">
      <h1>Mi perfil</h1>
      <p>Email: {usuario?.email} (no editable)</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>
          Nombre
          <input {...register('nombre', { required: true })} />
        </label>
        <button type="submit">Guardar cambios</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}
