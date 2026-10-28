import { useEffect, useRef, useState } from 'react';
import { consultasApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fecha, nombreCompleto } from '../utils.js';

<<<<<<< HEAD
const MAX_FILES = 1;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const formatSize = (bytes) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

=======
>>>>>>> parent of 42f1ba7 (Intentodeenviodearchivos)
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
<<<<<<< HEAD
  const seleccionarArchivos = (e) => {
    const seleccionados = Array.from(e.target.files || []);
    e.target.value = '';
    if (archivos.length + seleccionados.length > MAX_FILES) {
      toast.error('Podés enviar una foto por mensaje.');
      return;
    }
    const invalido = seleccionados.find((file) => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES);
    if (invalido) {
      toast.error(invalido.size > MAX_FILE_BYTES
        ? `${invalido.name} supera el máximo de 5 MB.`
        : 'Solo se permiten fotos JPG, PNG o WEBP.');
      return;
    }
    setArchivos((actuales) => [...actuales, ...seleccionados]);
  };
  const quitarArchivo = (indice) => setArchivos((actuales) => actuales.filter((_, i) => i !== indice));
=======
>>>>>>> parent of 42f1ba7 (Intentodeenviodearchivos)

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
<<<<<<< HEAD
        <>
          <p className="attachment-help">Podés elegir o tomar una foto JPG, PNG o WEBP de hasta 5 MB. Se conserva temporalmente mientras el servidor siga activo.</p>
          {archivos.length > 0 && <div className="selected-files">{archivos.map((file, indice) => (
            <div className="selected-file" key={`${file.name}-${file.lastModified}-${indice}`}>
              <span aria-hidden="true">{file.type.startsWith('image/') ? '▧' : '▤'}</span>
              <span><strong>{file.name}</strong><small>{formatSize(file.size)}</small></span>
              <button type="button" className="remove-file" onClick={() => quitarArchivo(indice)} aria-label={`Quitar ${file.name}`}>×</button>
            </div>
          ))}</div>}
          <form onSubmit={enviar} className="chat-composer">
            <input ref={selectorArchivos} className="visually-hidden" id={`adjuntos-${consultaId}`} type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={seleccionarArchivos} />
            <button type="button" className="chat-attach" onClick={() => selectorArchivos.current?.click()} disabled={enviando || archivos.length >= MAX_FILES} aria-label="Enviar una foto" title="Enviar una foto">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.4 11.1 12 20.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" /></svg>
            </button>
            <label className="visually-hidden" htmlFor={`mensaje-${consultaId}`}>Escribe un mensaje para el técnico</label>
            <input id={`mensaje-${consultaId}`} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí tu mensaje…" maxLength={2000} />
            <button className="chat-send" disabled={enviando || (!texto.trim() && archivos.length === 0)} aria-label={enviando ? 'Enviando mensaje' : 'Enviar mensaje'}>
              {enviando ? '…' : <><span aria-hidden="true">➤</span><span className="chat-send-label">Enviar</span></>}
            </button>
          </form>
        </>
=======
        <form onSubmit={enviar} className="chat-composer">
          <label className="visually-hidden" htmlFor={`mensaje-${consultaId}`}>Escribe un mensaje para el técnico</label>
          <input id={`mensaje-${consultaId}`} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí tu mensaje…" maxLength={2000} />
          <button className="chat-send" disabled={enviando || !texto.trim()} aria-label={enviando ? 'Enviando mensaje' : 'Enviar mensaje'}>
            {enviando ? '…' : <><span aria-hidden="true">➤</span><span className="chat-send-label">Enviar</span></>}
          </button>
        </form>
>>>>>>> parent of 42f1ba7 (Intentodeenviodearchivos)
      ))}
    </section>
  );
}
