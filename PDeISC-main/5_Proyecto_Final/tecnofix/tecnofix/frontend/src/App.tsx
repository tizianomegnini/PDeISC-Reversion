import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute, { homePorRol } from './components/ProtectedRoute';
import Loading from './components/Loading';
import { useAuth } from './context/AuthContext';
import { Login, Register, ChangePassword } from './features/auth';
import { Profile } from './features/profile';
import { ConsultaDetalle, MisConsultas, NuevaConsulta } from './features/consultations';
import { TecnicoPanel } from './features/technician';
import {
  AdminResumen,
  AdminPendientes,
  AdminTecnicos,
  AdminLocales,
  AdminEstadisticas,
} from './features/admin';

/**
 * Punto de entrada del router principal. Sentimos a los usuarios a su pantalla
 * inicial según el rol y sincronizamos el tema visual del sitio.
 */
function Inicio() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return <Navigate to={user ? homePorRol[user.rol] : '/login'} replace />;
}

/**
 * Configura el árbol de rutas de la app y centraliza la navegación por rol.
 *
 * @returns El layout global con navbar y rutas protegidas.
 */
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
