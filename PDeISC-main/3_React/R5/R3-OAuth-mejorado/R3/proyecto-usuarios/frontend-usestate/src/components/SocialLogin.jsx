import { useEffect, useState } from 'react';
import api from '../api/axios';

const iconos = { google:'G', github:'GH', discord:'DC' };
const proveedoresOcultos = new Set(['facebook', 'spotify']);

export default function SocialLogin() {
  const [proveedores, setProveedores] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/auth/oauth/providers').then((r) => setProveedores((r.data.proveedores || []).filter((p) => !proveedoresOcultos.has(p.id)))).catch(() => setError('No se pudo cargar la lista de proveedores.'));
  }, []);
  function entrar(id, configurado) {
    if (!configurado) return setError('Este proveedor todavía no está configurado en backend/.env.');
    window.location.assign(`${api.defaults.baseURL}/auth/oauth/${id}`);
  }
  return <section className="social-login" aria-label="Inicio de sesión con proveedores externos">
    <div className="separador"><span>o continuar con</span></div>
    <div className="social-grid">
      {proveedores.map((p) => <button key={p.id} type="button" className="social-btn" onClick={() => entrar(p.id, p.configurado)} disabled={!p.configurado} title={!p.configurado ? `${p.label}: falta configurarlo` : `Continuar con ${p.label}`}>
        <span className="social-icon">{iconos[p.id] || '•'}</span><span>{p.label}</span>{!p.configurado && <small>no configurado</small>}
      </button>)}
    </div>
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}
