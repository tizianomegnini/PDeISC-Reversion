import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultasApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

const TIPOS = ['Celular', 'Notebook', 'PC de escritorio', 'Tablet', 'Consola', 'Impresora', 'Otro'];

export default function NuevaConsulta() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tipo_equipo: '', marca: '', modelo: '', descripcion: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault(); setError(''); setEnviando(true);
    try {
      const { consulta } = await consultasApi.create(form);
      toast.ok(consulta.estado === 'asignada' ? 'Consulta creada y asignada a un técnico' : 'Consulta creada: quedó pendiente hasta que haya un técnico disponible');
      navigate(`/consultas/${consulta.id}`);
    } catch (err) { setError(err.message); } finally { setEnviando(false); }
  };
  return (
    <div className="card form-card">
      <div className="form-intro">
        <span className="eyebrow">PEDIR AYUDA</span>
        <h1>Nueva consulta de soporte</h1>
        <p>Contanos qué le pasa a tu equipo. Un técnico revisará el caso y te ayudará paso a paso.</p>
      </div>
      <div className="how-it-works" aria-label="Cómo funciona la consulta">
        <div><span>1</span><p><strong>Contanos el problema</strong><small>Con tus palabras, sin tecnicismos.</small></p></div>
        <div><span>2</span><p><strong>Te asignamos un técnico</strong><small>Vas a ver su respuesta acá.</small></p></div>
        <div><span>3</span><p><strong>Conversá por mensajes</strong><small>Todo queda en el detalle del caso.</small></p></div>
      </div>
      <form onSubmit={enviar} className="stack consultation-form">
        <div className="form-section-title"><h2>Sobre tu equipo <small>(opcional)</small></h2><p>Si no sabés estos datos, dejalos sin completar. El técnico puede ayudarte a identificarlos.</p></div>
        <label>¿Qué tipo de equipo es?<select value={form.tipo_equipo} onChange={set('tipo_equipo')}><option value="">No estoy seguro/a</option>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></label>
        <div className="form-grid">
          <label>Marca<input value={form.marca} onChange={set('marca')} maxLength={60} placeholder="Por ejemplo: Samsung" /></label>
          <label>Modelo<input value={form.modelo} onChange={set('modelo')} maxLength={80} placeholder="Si lo conocés" /></label>
        </div>
        <div className="form-section-title"><h2>¿Qué problema tiene?</h2><p>Decinos cuándo empezó y qué estabas intentando hacer. Evitá incluir contraseñas o datos privados.</p></div>
        <label className="description-field">Descripción del problema<textarea value={form.descripcion} onChange={set('descripcion')} required minLength={10} maxLength={2000} placeholder="Ejemplo: Desde ayer el celular se apaga aunque todavía tiene batería. Ya probé cargarlo y sigue pasando." /></label>
        <small className="field-hint">Escribí al menos 10 caracteres. Podés agregar más detalles después en los mensajes.</small>
        {error && <div className="alert error" role="alert">{error}</div>}
        <button className="form-submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Crear consulta'}</button>
      </form>
    </div>
  );
}
