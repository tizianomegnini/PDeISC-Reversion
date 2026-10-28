import { useState } from 'react';
import { adminApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';
import ConsultasTable from '../../components/ConsultasTable.jsx';

export default function AdminPendientes() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() => adminApi.pendientes());
  const [ocupado, setOcupado] = useState(false);

  const reintentarTodas = async () => {
    setOcupado(true);
    try {
      const r = await adminApi.reintentar();
      r.pendientes === 0 ? toast.ok('No hay consultas pendientes') : toast.ok(`Se asignaron ${r.asignadas} de ${r.pendientes} consultas pendientes`);
      await reload(true);
    } catch (e) { toast.error(e.message); } finally { setOcupado(false); }
  };
  const asignar = async (id) => {
    try { const r = await adminApi.asignar(id); r.asignada ? toast.ok('Consulta asignada') : toast.error('Ningún técnico tiene cupo disponible'); await reload(true); }
    catch (e) { toast.error(e.message); }
  };
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Consultas pendientes</h1>
        <button disabled={ocupado} onClick={reintentarTodas}>{ocupado ? 'Asignando…' : 'Reintentar asignación de todas'}</button>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Loading /> : data && <ConsultasTable consultas={data.consultas} mostrarCliente mostrarTecnico={false}>
        {(c) => <button className="secondary" onClick={() => asignar(c.id)}>Reintentar</button>}
      </ConsultasTable>}
    </>
  );
}
