import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Contraparte de PrivateRoute: /login y /register solo tienen sentido sin
// sesión. Si ya estás logueado te manda al panel (antes te dejaba ver el login).
export default function PublicRoute({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return <p className="cargando">Cargando...</p>;
  if (usuario) return <Navigate to="/dashboard" replace />;

  return children;
}
