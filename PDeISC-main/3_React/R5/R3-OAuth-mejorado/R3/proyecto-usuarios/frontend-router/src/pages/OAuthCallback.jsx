import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = params.get('code');
    const oauthError = params.get('oauth_error');
    if (oauthError) {
      setError(oauthError);
      return;
    }
    if (!code) {
      setError('Falta el código de autenticación.');
      return;
    }

    api.post('/auth/oauth/exchange', { code })
      .then(async (res) => {
        localStorage.setItem('token', res.data.token);
        const me = await api.get('/auth/me');
        login(res.data.token, me.data.usuario);
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => setError(err.response?.data?.error || 'No se pudo completar el inicio de sesión.'));
  }, [params, navigate, login]);

  return (
    <div className="tarjeta">
      <h1>{error ? 'No se pudo iniciar sesión' : 'Iniciando sesión…'}</h1>
      {error && <><p className="error" role="alert">{error}</p><button type="button" onClick={() => navigate('/login')}>Volver al login</button></>}
    </div>
  );
}
