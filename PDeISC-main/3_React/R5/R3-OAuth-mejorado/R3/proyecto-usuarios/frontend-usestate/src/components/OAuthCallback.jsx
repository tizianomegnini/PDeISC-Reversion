import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback({ irA }) {
  const { login } = useAuth();
  const [error, setError] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const oauthError = params.get('oauth_error');
    if (oauthError) return setError(oauthError);
    if (!code) return setError('Falta el código de autenticación.');
    api.post('/auth/oauth/exchange', { code })
      .then(async (res) => {
        const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${res.data.token}` } });
        login(res.data.token, me.data.usuario);
        window.history.replaceState({}, '', '/');
        irA('dashboard');
      })
      .catch((err) => setError(err.response?.data?.error || 'No se pudo completar el inicio de sesión.'));
  }, [irA, login]);
  return <div className="tarjeta"><h1>{error ? 'No se pudo iniciar sesión' : 'Iniciando sesión…'}</h1>{error && <><p className="error">{error}</p><button type="button" onClick={() => { window.history.replaceState({}, '', '/'); irA('login'); }}>Volver al login</button></>}</div>;
}
