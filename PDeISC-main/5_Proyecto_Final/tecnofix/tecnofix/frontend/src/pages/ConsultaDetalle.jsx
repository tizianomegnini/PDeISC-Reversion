import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { consultasApi } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loading from '../components/Loading.jsx';
import ErrorBox from '../components/ErrorBox.jsx';
import EstadoBadge from '../components/EstadoBadge.jsx';
import Stars from '../components/Stars.jsx';
import Chat from '../components/Chat.jsx';
import { equipo, fecha, nombreCompleto } from '../utils.js';

// Debe reflejar las transiciones del backend (backend/src/services/consultas.js). El backend es quien las valida.
const ACCIONES_TECNICO = {
  asignada: [['en_proceso', 'Comenzar atención']],
  en_proceso: [['esperando_cliente', 'Esperar respuesta del cliente'], ['finalizada', 'Finalizar']],
  esperando_cliente: [['en_proceso', 'Retomar atención'], ['finalizada', 'Finalizar']],
};
const AYUDA_ESTADO = {
  pendiente: 'Estamos buscando un técnico con lugar disponible. No hace falta crear otra consulta; te avisaremos acá cuando se asigne.',
  asignada: 'Un técnico ya recibió tu caso. Podés escribirle abajo para contar más detalles o responder sus preguntas.',
  en_proceso: 'El técnico está atendiendo tu caso. Podés seguir la conversación desde los mensajes.',
  esperando_cliente: 'El técnico necesita una respuesta tuya para continuar. Contestale desde los mensajes.',
  finalizada: 'La atención terminó. Si el problema se resolvió, podés dejar una valoración para ayudar a otras personas.',
  cancelada: 'Esta consulta fue cancelada y ya no admite nuevos mensajes.',
};

export default function ConsultaDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() => consultasApi.get(id), [id]);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [ocupado, setOcupado] = useState(false);

  if (loading) return <Loading />;
  if (error) return <><ErrorBox error={error} onRetry={reload} /><Link to="/">Volver</Link></>;
  const c = data.consulta;
  const cerrada = ['finalizada', 'cancelada'].includes(c.estado);

  const cambiar = async (estado) => {
    if (estado === 'cancelada' && !window.confirm('¿Cancelar esta consulta?')) return;
    setOcupado(true);
    try { await consultasApi.setEstado(c.id, estado); toast.ok('Estado actualizado'); await reload(true); }
    catch (e) { toast.error(e.message); } finally { setOcupado(false); }
  };
  const valorar = async (e) => {
    e.preventDefault();
    if (!estrellas) return toast.error('Elija de 1 a 5 estrellas');
    setOcupado(true);
    try { await consultasApi.valorar(c.id, estrellas, comentario || null); toast.ok('¡Gracias por su valoración!'); await reload(true); }
    catch (e2) { toast.error(e2.message); } finally { setOcupado(false); }
  };

  return (
    <>
      <p><Link to={user.rol === 'cliente' ? '/consultas' : user.rol === 'tecnico' ? '/tecnico' : '/admin/pendientes'}>← Volver</Link></p>
      <h1>Consulta #{c.id} <EstadoBadge estado={c.estado} /></h1>
      {user.rol === 'cliente' && <>
        <p className="page-guidance">Acá podés seguir el caso y escribirle al técnico. Los mensajes nuevos aparecen automáticamente cada unos segundos.</p>
        <div className="status-guide"><strong>¿Qué significa este estado?</strong><span>{AYUDA_ESTADO[c.estado]}</span></div>
      </>}
      <div className="two-col">
        <section className="card">
          <h3>Equipo y problema</h3>
          <dl className="datos">
            <dt>Equipo</dt><dd>{equipo(c)}</dd>
            <dt>Problema</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{c.descripcion}</dd>
            <dt>Creada</dt><dd>{fecha(c.created_at)}</dd>
            {c.finalizada_at && <><dt>Finalizada</dt><dd>{fecha(c.finalizada_at)}</dd></>}
          </dl>
        </section>
        <section className="card">
          <h3>{user.rol === 'cliente' ? 'Atención' : 'Cliente y asignación'}</h3>
          <dl className="datos">
            {user.rol !== 'cliente' && <><dt>Cliente</dt><dd>{nombreCompleto(c.cliente_nombre, c.cliente_apellido)}</dd>
              <dt>Contacto</dt><dd>{c.cliente_email}{c.cliente_telefono ? ` · ${c.cliente_telefono}` : ''}</dd></>}
            <dt>Técnico</dt><dd>{c.tecnico_id ? nombreCompleto(c.tecnico_nombre, c.tecnico_apellido) : 'Sin asignar todavía'}</dd>
            <dt>Local</dt><dd>{c.local_nombre ? `${c.local_nombre} — ${c.local_direccion}, ${c.local_ciudad}` : '—'}</dd>
          </dl>
          {user.rol === 'tecnico' && (
            <div className="row" style={{ marginTop: '.8rem' }}>
              {(ACCIONES_TECNICO[c.estado] || []).map(([e, label]) => <button key={e} disabled={ocupado} onClick={() => cambiar(e)}>{label}</button>)}
            </div>
          )}
          {user.rol === 'cliente' && !cerrada && <button className="danger" style={{ marginTop: '.8rem' }} disabled={ocupado} onClick={() => cambiar('cancelada')}>Cancelar consulta</button>}
        </section>
      </div>

      {c.estado === 'finalizada' && (
        <section className="card">
          <h3>Valoración</h3>
          {c.valoracion_estrellas ? (
            <p><Stars value={c.valoracion_estrellas} /> {c.valoracion_comentario && <span className="muted">“{c.valoracion_comentario}”</span>}</p>
          ) : user.rol === 'cliente' ? (
            <form onSubmit={valorar} className="stack">
              <Stars value={estrellas} onChange={setEstrellas} size="2rem" />
              <label>Comentario (opcional)<textarea value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={500} style={{ minHeight: 70 }} /></label>
              <button disabled={ocupado}>Enviar valoración</button>
            </form>
          ) : <p className="muted">El cliente todavía no calificó esta consulta.</p>}
        </section>
      )}

      <Chat consultaId={c.id} cerrada={cerrada} onSent={() => reload(true)} />
    </>
  );
}
