import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return <p className="cargando">Cargando...</p>;
  if (!usuario) return <Navigate to="/login" replace />;

  return children;
}
