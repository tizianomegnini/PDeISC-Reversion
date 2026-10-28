import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // NavLink agrega la clase "activo" al enlace de la página actual
  const clase = ({ isActive }) => (isActive ? 'activo' : undefined);

  return (
    <nav className="navbar">
      <span className="marca">Mi Web-Router</span>
      <div className="enlaces">
        {usuario ? (
          <>
            <NavLink to="/dashboard" className={clase}>Panel</NavLink>
            <NavLink to="/perfil" className={clase}>Perfil</NavLink>
            <button onClick={handleLogout}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={clase}>Entrar</NavLink>
            <NavLink to="/register" className={clase}>Registrarse</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
