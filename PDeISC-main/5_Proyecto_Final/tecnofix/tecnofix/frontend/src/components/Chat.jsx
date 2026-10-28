import { useEffect, useRef, useState } from 'react';
import { consultasApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fecha, nombreCompleto } from '../utils.js';

/** Mensajes de una consulta. Se actualiza solo cada 8 segundos (sondeo simple, sin websockets). */
export default function Chat({ consultaId, cerrada, onSent }) {
  const { user } = useAuth();
  const toast = useToast();
  const [mensajes, setMensajes] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fin = useRef(null);

  const cargar = () => consultasApi.mensajes(consultaId).then((r) => setMensajes(r.mensajes)).catch(() => {});
  useEffect(() => { cargar(); const t = setInterval(cargar, 8000); return () => clearInterval(t); }, [consultaId]); // eslint-disable-line
  useEffect(() => { fin.current?.scrollIntoView({ block: 'nearest' }); }, [mensajes?.length]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try { await consultasApi.enviarMensaje(consultaId, texto); setTexto(''); await cargar(); onSent?.(); }
    catch (err) { toast.error(err.message); }
    finally { setEnviando(false); }
  };
  return (
    <section className="card chat-panel">
      <header className="chat-heading">
        <div>
          <span className="eyebrow">CONVERSACIÓN</span>
          <h3>Mensajes de la consulta</h3>
          <p>Escribí como en un chat. Si podés, contá qué estabas haciendo cuando apareció el problema. Los mensajes se actualizan automáticamente cada unos segundos.</p>
        </div>
        <span className="chat-live" aria-label="Mensajes actualizados automáticamente"><span /> Actualización automática</span>
      </header>
      <div className="chat">
        {mensajes === null && <p className="loading">Cargando mensajes…</p>}
        {mensajes?.length === 0 && <div className="chat-empty"><span aria-hidden="true">✉</span><strong>La conversación empieza acá</strong><p>Mandale un mensaje al técnico si querés agregar detalles o hacer una pregunta.</p></div>}
        {mensajes?.map((m) => (
          <div key={m.id} className={`msg ${m.autor_id === user.id ? 'mine' : ''}`}>
            <small>{nombreCompleto(m.autor_nombre, m.autor_apellido)} · {fecha(m.created_at)}</small>
            <p>{m.contenido}</p>
          </div>
        ))}
        <div ref={fin} />
      </div>
      {user.rol !== 'admin' && (cerrada ? <p className="chat-closed">Esta consulta ya terminó y la conversación está cerrada.</p> : (
        <form onSubmit={enviar} className="chat-composer">
          <label className="visually-hidden" htmlFor={`mensaje-${consultaId}`}>Escribe un mensaje para el técnico</label>
          <input id={`mensaje-${consultaId}`} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí tu mensaje…" maxLength={2000} />
          <button className="chat-send" disabled={enviando || !texto.trim()} aria-label={enviando ? 'Enviando mensaje' : 'Enviar mensaje'}>
            {enviando ? '…' : <><span aria-hidden="true">➤</span><span className="chat-send-label">Enviar</span></>}
          </button>
        </form>
      ))}
    </section>
  );
}
