import { useState } from 'react';
import { adminApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';
import { promedio } from '../../utils.js';

const VACIO = { nombre: '', apellido: '', email: '', telefono: '', local_id: '', especialidad: '', limite_consultas: '' };

export default function AdminTecnicos() {
  const toast = useToast();
  const tecnicos = useFetch(() => adminApi.tecnicos());
  const locales = useFetch(() => adminApi.locales());
  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState(null); // id del técnico en edición
  const [passwordTemporal, setPasswordTemporal] = useState('');
  const [creds, setCreds] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const localesActivos = (locales.data?.locales || []).filter((l) => l.activo);

  const editar = (t) => { setEditando(t.id); setPasswordTemporal(''); setCreds(null); setForm({ nombre: t.nombre, apellido: t.apellido, email: t.email, telefono: t.telefono || '', local_id: String(t.local_id), especialidad: t.especialidad || '', limite_consultas: String(t.limite_consultas) }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelar = () => { setEditando(null); setPasswordTemporal(''); setForm(VACIO); };

  const guardar = async (e) => {
    e.preventDefault(); setOcupado(true);
    try {
      const base = { nombre: form.nombre, apellido: form.apellido, telefono: form.telefono || null, local_id: Number(form.local_id), especialidad: form.especialidad || null };
      if (form.limite_consultas !== '') base.limite_consultas = Number(form.limite_consultas);
      if (editando) { await adminApi.editarTecnico(editando, base); toast.ok('Técnico actualizado'); }
      else {
        const r = await adminApi.crearTecnico({ ...base, email: form.email });
        setCreds({ email: form.email, password: r.password_temporal }); toast.ok('Técnico creado');
      }
      cancelar(); await tecnicos.reload(true);
    } catch (err) { toast.error(err.message); } finally { setOcupado(false); }
  };
  const accion = async (fn, msg, confirmar) => {
    if (confirmar && !window.confirm(confirmar)) return;
    try { await fn(); toast.ok(msg); await tecnicos.reload(true); } catch (err) { toast.error(err.message); }
  };
  const restablecerPassword = async (e) => {
    e.preventDefault();
    if (!editando) return;
    setOcupado(true);
    try {
      await adminApi.restablecerPasswordTecnico(editando, passwordTemporal);
      setPasswordTemporal('');
      toast.ok('Contraseña restablecida. El técnico deberá cambiarla al ingresar.');
    } catch (err) { toast.error(err.message); }
    finally { setOcupado(false); }
  };

  return (
    <>
      <h1>Técnicos</h1>
      {creds && (
        <div className="alert ok">
          Cuenta creada. Entregue estos datos al técnico (la contraseña <b>no se vuelve a mostrar</b> y deberá cambiarla al ingresar):<br />
          <b>{creds.email}</b> · contraseña temporal: <code>{creds.password}</code>
          <button type="button" className="link" style={{ marginLeft: 8 }} onClick={() => setCreds(null)}>Cerrar</button>
        </div>
      )}
      <section className="card">
        <h3>{editando ? 'Editar técnico' : 'Nuevo técnico'}</h3>
        <form onSubmit={guardar}>
          <div className="form-grid">
            <label>Nombre<input value={form.nombre} onChange={set('nombre')} required /></label>
            <label>Apellido<input value={form.apellido} onChange={set('apellido')} required /></label>
            <label>Email<input type="email" value={form.email} onChange={set('email')} required disabled={!!editando} /></label>
            <label>Teléfono<input value={form.telefono} onChange={set('telefono')} /></label>
            <label>Local<select value={form.local_id} onChange={set('local_id')} required><option value="">Seleccione…</option>{localesActivos.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}</select></label>
            <label>Especialidad<input value={form.especialidad} onChange={set('especialidad')} /></label>
            <label>Límite de consultas activas<input type="number" min="0" max="1000" value={form.limite_consultas} onChange={set('limite_consultas')} placeholder="Por defecto" /></label>
          </div>
          <div className="row" style={{ marginTop: '.8rem' }}>
            <button disabled={ocupado}>{editando ? 'Guardar cambios' : 'Crear técnico'}</button>
            {editando && <button type="button" className="secondary" onClick={cancelar}>Cancelar edición</button>}
          </div>
        </form>
      </section>
      {editando && (
        <section className="card">
          <h3>Restablecer contraseña</h3>
          <p className="muted">Definí una contraseña provisoria. El técnico deberá cambiarla al iniciar sesión.</p>
          <form onSubmit={restablecerPassword} className="row">
            <label>Contraseña provisoria<input type="password" value={passwordTemporal} onChange={(e) => setPasswordTemporal(e.target.value)} required minLength={8} maxLength={72} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,72}" title="Debe tener al menos 8 caracteres, una letra y un número." autoComplete="new-password" /></label>
            <button disabled={ocupado || !passwordTemporal}>Restablecer contraseña</button>
          </form>
        </section>
      )}

      <ErrorBox error={tecnicos.error} onRetry={tecnicos.reload} />
      {tecnicos.loading ? <Loading /> : tecnicos.data && (
        <div className="table-responsive rounded border bg-body mb-3"><table className="table table-striped table-hover align-middle mb-0">
          <thead><tr><th>Técnico</th><th>Local</th><th>Activas / límite</th><th>Atendidas</th><th>Valoración</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {tecnicos.data.tecnicos.map((t) => {
              const eliminado = !!t.deleted_at;
              const estado = eliminado ? 'Eliminado' : !t.activo ? 'Desactivado' : t.habilitado ? 'Habilitado' : 'No habilitado';
              return (
                <tr key={t.id} style={eliminado ? { opacity: .55 } : undefined}>
                  <td>{t.nombre} {t.apellido}<br /><small className="muted">{t.email}{t.especialidad ? ` · ${t.especialidad}` : ''}</small></td>
                  <td>{t.local_nombre}</td>
                  <td>{t.activas} / {t.limite_consultas}</td>
                  <td>{t.atendidas}</td>
                  <td>{promedio(t.promedio)} <small className="muted">({t.cantidad_valoraciones})</small></td>
                  <td>{estado}</td>
                  <td className="actions">{!eliminado && <>
                    <button className="secondary" onClick={() => editar(t)}>Editar</button>
                    {t.activo
                      ? <button className="secondary" onClick={() => accion(() => adminApi.estadoTecnico(t.id, false), 'Técnico desactivado', 'Sus consultas activas volverán a la cola para reasignarse. ¿Desactivar?')}>Desactivar</button>
                      : <button className="secondary" onClick={() => accion(() => adminApi.estadoTecnico(t.id, true), 'Técnico activado')}>Activar</button>}
                    <button className="danger" onClick={() => accion(() => adminApi.eliminarTecnico(t.id), 'Técnico eliminado (se conserva su historial)', 'Eliminación lógica: el técnico no podrá ingresar pero su historial se conserva. ¿Continuar?')}>Eliminar</button>
                  </>}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}
    </>
  );
}
