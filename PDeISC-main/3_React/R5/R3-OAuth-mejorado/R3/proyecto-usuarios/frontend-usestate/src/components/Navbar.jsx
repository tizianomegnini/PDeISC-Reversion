import { useAuth } from '../context/AuthContext';

// Recibe la vista actual y la función para cambiarla, ya que acá no hay
// rutas de verdad: la navegación es solo un cambio de estado en App.jsx
export default function Navbar({ vista, irA }) {
  const { usuario, logout } = useAuth();

  function handleLogout() {
    logout();
    irA('login');
  }

  // Marca el botón de la vista actual (el prop "vista" antes no se usaba)
  const props = (nombre) => ({
    className: vista === nombre ? 'activo' : undefined,
    'aria-current': vista === nombre ? 'page' : undefined,
    onClick: () => irA(nombre),
  });

  return (
    <nav className="navbar">
      <span className="marca">Mi Web-Usestate</span>
      <div className="enlaces">
        {usuario ? (
          <>
            <button {...props('dashboard')}>Panel</button>
            <button {...props('perfil')}>Perfil</button>
            <button onClick={handleLogout}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <button {...props('login')}>Entrar</button>
            <button {...props('register')}>Registrarse</button>
          </>
        )}
      </div>
    </nav>
  );
}
