import { useState } from 'react';
import { adminApi } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading';
import ErrorBox from '../../components/ErrorBox';
import ConsultasTable from '../../components/ConsultasTable';
import { errorMessage } from '../../services/api';

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
    } catch (error) { toast.error(errorMessage(error)); } finally { setOcupado(false); }
  };
  const asignar = async (id: number) => {
    try { const r = await adminApi.asignar(id); r.asignada ? toast.ok('Consulta asignada') : toast.error('Ningún técnico tiene cupo disponible'); await reload(true); }
    catch (error) { toast.error(errorMessage(error)); }
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
