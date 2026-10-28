import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from './Loading.jsx';

export const homePorRol = { cliente: '/consultas', tecnico: '/tecnico', admin: '/admin' };

/** El backend vuelve a verificar rol y sesión en cada llamada; esto solo evita mostrar pantallas que no corresponden. */
export default function ProtectedRoute({ roles, allowPasswordChange = false }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (user.debe_cambiar_password && !allowPasswordChange) return <Navigate to="/cambiar-password" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to={homePorRol[user.rol]} replace />;
  return <Outlet />;
}
