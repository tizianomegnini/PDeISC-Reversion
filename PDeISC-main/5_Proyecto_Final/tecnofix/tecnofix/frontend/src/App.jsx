import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute, { homePorRol } from './components/ProtectedRoute.jsx';
import Loading from './components/Loading.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import Profile from './pages/Profile.jsx';
import ConsultaDetalle from './pages/ConsultaDetalle.jsx';
import MisConsultas from './pages/cliente/MisConsultas.jsx';
import NuevaConsulta from './pages/cliente/NuevaConsulta.jsx';
import TecnicoPanel from './pages/tecnico/TecnicoPanel.jsx';
import AdminResumen from './pages/admin/AdminResumen.jsx';
import AdminPendientes from './pages/admin/AdminPendientes.jsx';
import AdminTecnicos from './pages/admin/AdminTecnicos.jsx';
import AdminLocales from './pages/admin/AdminLocales.jsx';
import AdminEstadisticas from './pages/admin/AdminEstadisticas.jsx';

function Inicio() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return <Navigate to={user ? homePorRol[user.rol] : '/login'} replace />;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('tecnofix-theme') || 'light');
  const { user } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('tecnofix-theme', theme);
  }, [theme]);

  return (
    <>
      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
      />
      <main className={`container app-main app-main--${user?.rol || 'guest'} py-4`}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />

          <Route element={<ProtectedRoute allowPasswordChange />}>
            <Route path="/cambiar-password" element={<ChangePassword />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/perfil" element={<Profile />} />
            <Route path="/consultas/:id" element={<ConsultaDetalle />} />
          </Route>
          <Route element={<ProtectedRoute roles={['cliente']} />}>
            <Route path="/consultas" element={<MisConsultas />} />
            <Route path="/consultas/nueva" element={<NuevaConsulta />} />
          </Route>
          <Route element={<ProtectedRoute roles={['tecnico']} />}>
            <Route path="/tecnico" element={<TecnicoPanel />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminResumen />} />
            <Route path="/admin/pendientes" element={<AdminPendientes />} />
            <Route path="/admin/tecnicos" element={<AdminTecnicos />} />
            <Route path="/admin/locales" element={<AdminLocales />} />
            <Route path="/admin/estadisticas" element={<AdminEstadisticas />} />
          </Route>
          <Route path="*" element={<p>Página no encontrada.</p>} />
        </Routes>
      </main>
    </>
  );
}
