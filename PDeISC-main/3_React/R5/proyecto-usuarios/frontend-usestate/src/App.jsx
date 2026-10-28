import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import './styles.css';

// Acá NO se usa react-router: la "página" que se ve es simplemente un
// estado (vista) que se cambia con setVista. Es más simple pero pierde
// cosas que da el router de fábrica: URL real, botón atrás del navegador, etc.
function Contenido() {
  const { usuario, cargando } = useAuth();
  const [vista, setVista] = useState('login');

  // Si el usuario ya está logueado (por ejemplo, recuperado desde localStorage
  // al recargar la página) lo mandamos directo al panel.
  useEffect(() => {
    if (usuario && (vista === 'login' || vista === 'register')) {
      setVista('dashboard');
    }
  }, [usuario]);

  if (cargando) return <p className="cargando">Cargando...</p>;

  // Protección manual de vistas: si pide dashboard/perfil sin sesión, lo mandamos a login
  const vistasPrivadas = ['dashboard', 'perfil'];
  const vistaFinal = vistasPrivadas.includes(vista) && !usuario ? 'login' : vista;

  return (
    <>
      <Navbar vista={vistaFinal} irA={setVista} />
      <main className="contenedor">
        {vistaFinal === 'login' && <Login irA={setVista} />}
        {vistaFinal === 'register' && <Register irA={setVista} />}
        {vistaFinal === 'dashboard' && <Dashboard />}
        {vistaFinal === 'perfil' && <Profile />}
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Contenido />
    </AuthProvider>
  );
}
