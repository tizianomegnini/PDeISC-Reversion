import { useState } from 'react';
import { adminApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';

const VACIO = { nombre: '', direccion: '', ciudad: '', telefono: '' };

export default function AdminLocales() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() => adminApi.locales());
  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    const body = { ...form, telefono: form.telefono || null };
    try {
      if (editando) { await adminApi.editarLocal(editando, body); toast.ok('Local actualizado'); }
      else { await adminApi.crearLocal(body); toast.ok('Local creado'); }
      setEditando(null); setForm(VACIO); await reload(true);
    } catch (err) { toast.error(err.message); }
  };
  const cambiarActivo = async (l, activo) => {
    try {
      await adminApi.editarLocal(l.id, { nombre: l.nombre, direccion: l.direccion, ciudad: l.ciudad, telefono: l.telefono, activo });
      toast.ok(activo ? 'Local activado' : 'Local desactivado'); await reload(true);
    } catch (err) { toast.error(err.message); }
  };
  return (
    <>
      <h1>Locales</h1>
      <section className="card">
        <h3>{editando ? 'Editar local' : 'Nuevo local'}</h3>
        <form onSubmit={guardar}>
          <div className="form-grid">
            <label>Nombre<input value={form.nombre} onChange={set('nombre')} required /></label>
            <label>Dirección<input value={form.direccion} onChange={set('direccion')} required /></label>
            <label>Ciudad<input value={form.ciudad} onChange={set('ciudad')} required /></label>
            <label>Teléfono<input value={form.telefono} onChange={set('telefono')} /></label>
          </div>
          <div className="row" style={{ marginTop: '.8rem' }}>
            <button>{editando ? 'Guardar cambios' : 'Crear local'}</button>
            {editando && <button type="button" className="secondary" onClick={() => { setEditando(null); setForm(VACIO); }}>Cancelar edición</button>}
          </div>
        </form>
      </section>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Loading /> : data && (
        <div className="table-responsive rounded border bg-body mb-3"><table className="table table-striped table-hover align-middle mb-0">
          <thead><tr><th>Local</th><th>Dirección</th><th>Técnicos</th><th>Activas</th><th>Atendidas</th><th>Estado</th><th /></tr></thead>
          <tbody>{data.locales.map((l) => (
            <tr key={l.id} style={!l.activo ? { opacity: .55 } : undefined}>
              <td>{l.nombre}</td><td>{l.direccion}, {l.ciudad}</td><td>{l.tecnicos}</td><td>{l.activas}</td><td>{l.atendidas}</td>
              <td>{l.activo ? 'Activo' : 'Inactivo'}</td>
              <td className="actions">
                <button className="secondary" onClick={() => { setEditando(l.id); setForm({ nombre: l.nombre, direccion: l.direccion, ciudad: l.ciudad, telefono: l.telefono || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button>
                {l.activo
                  ? <button className="danger" onClick={() => window.confirm('Los técnicos de un local inactivo dejan de recibir consultas nuevas. ¿Desactivar?') && cambiarActivo(l, false)}>Desactivar</button>
                  : <button className="secondary" onClick={() => cambiarActivo(l, true)}>Activar</button>}
              </td>
            </tr>))}
          </tbody>
        </table></div>
      )}
    </>
  );
}
