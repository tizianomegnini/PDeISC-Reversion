import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  // Mensaje para mostrar en el login cuando la sesión se cierra "sola"
  const [aviso, setAviso] = useState('');

  // Al arrancar, si hay token guardado se intenta recuperar la sesión.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCargando(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUsuario(res.data.usuario))
      .catch((err) => {
        const status = err.response?.status;
        if (status === 401 || status === 404) {
          // El token realmente no sirve (vencido, inválido o usuario borrado)
          localStorage.removeItem('token');
        } else {
          // Backend caído / sin red / error 500: el token puede seguir siendo
          // bueno, así que NO se borra. Antes se borraba ante cualquier error
          // y bastaba con que el backend tardara en arrancar para perder la sesión.
          setAviso('No se pudo restaurar tu sesión: el servidor no responde. Recargá la página cuando esté encendido.');
        }
      })
      .finally(() => setCargando(false));
  }, []);

  // Si el token vence mientras la app está abierta, cerramos la sesión en pantalla.
  useEffect(() => {
    function alExpirar() {
      localStorage.removeItem('token');
      setUsuario(null);
      setAviso('Tu sesión expiró. Iniciá sesión de nuevo.');
    }
    window.addEventListener('auth:expirado', alExpirar);
    return () => window.removeEventListener('auth:expirado', alExpirar);
  }, []);

  function login(token, datosUsuario) {
    localStorage.setItem('token', token);
    setAviso('');
    setUsuario(datosUsuario);
  }

  function logout() {
    localStorage.removeItem('token');
    setAviso('');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, login, logout, cargando, aviso }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
