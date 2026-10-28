import { useAuth } from '../context/AuthContext';

// Recibe la vista actual y la función para cambiarla, ya que acá no hay
// rutas de verdad: la navegación es solo un cambio de estado en App.jsx
export default function Navbar({ vista, irA }) {
  const { usuario, logout } = useAuth();

  function handleLogout() {
    logout();
    irA('login');
  }

  return (
    <nav className="navbar">
      <span className="marca">Mi App</span>
      <div className="enlaces">
        {usuario ? (
          <>
            <button onClick={() => irA('dashboard')}>Panel</button>
            <button onClick={() => irA('perfil')}>Perfil</button>
            <button onClick={handleLogout}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <button onClick={() => irA('login')}>Entrar</button>
            <button onClick={() => irA('register')}>Registrarse</button>
          </>
        )}
      </div>
    </nav>
  );
}
