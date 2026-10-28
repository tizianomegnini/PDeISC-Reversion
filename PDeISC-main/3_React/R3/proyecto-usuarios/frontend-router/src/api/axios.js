import axios from 'axios';

const api = axios.create({
  // Configurable con un archivo .env en el front: VITE_API_URL=https://mi-api.com/api
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor responde 401 teniendo un token guardado, la sesión venció (o
// el token no sirve): se lo avisamos a AuthContext para que cierre la sesión
// en pantalla. Se excluyen login/registro: ahí un 401 significa "credenciales
// incorrectas", no "sesión vencida".
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const esAuthPublica = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !esAuthPublica && localStorage.getItem('token')) {
      window.dispatchEvent(new Event('auth:expirado'));
    }
    return Promise.reject(err);
  }
);

// Devuelve un mensaje útil para mostrar al usuario según qué falló.
// Antes cualquier fallo (incluido "el backend está apagado") se mostraba
// como "Error al iniciar sesión", sin pistas de qué pasaba.
export function mensajeDeError(err, porDefecto) {
  if (err.response) return err.response.data?.error || porDefecto;
  if (err.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Probá de nuevo.';
  return 'No se pudo conectar con el servidor. ¿Está encendido el backend (puerto 4000)?';
}

export default api;
