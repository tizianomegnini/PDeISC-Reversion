import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const MENU = {
  cliente: [['/consultas', 'Mis consultas'], ['/consultas/nueva', 'Nueva consulta'], ['/perfil', 'Mis datos']],
  tecnico: [['/tecnico', 'Mis consultas'], ['/perfil', 'Mis datos']],
  admin: [['/admin', 'Resumen'], ['/admin/pendientes', 'Pendientes'], ['/admin/tecnicos', 'Técnicos'], ['/admin/locales', 'Locales'], ['/admin/estadisticas', 'Estadísticas'], ['/perfil', 'Mis datos']],
};

export default function Navbar({ theme, onToggleTheme }) {
  const [abierto, setAbierto] = useState(false);
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const salir = async () => { await logout(); setAbierto(false); toast.ok('Sesión cerrada'); navigate('/login'); };
  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active fw-semibold' : ''}`;
  const rolLabel = { cliente: 'Cliente', tecnico: 'Técnico', admin: 'Administración' };

  return (
    <header className={`navbar navbar-expand-lg bg-body-tertiary border-bottom shadow-sm app-navbar app-navbar--${user?.rol || 'guest'}`}>
      <div className="container flex-wrap">
        <NavLink className="navbar-brand text-primary fw-bold" to="/">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>TecnoFix</span>
        </NavLink>
        <button className="navbar-toggler" type="button" aria-label="Abrir menú" aria-expanded={abierto}
          aria-controls="navegacion-principal" onClick={() => setAbierto(!abierto)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div id="navegacion-principal" className={`collapse navbar-collapse${abierto ? ' show' : ''}`}>
          <nav className="navbar-nav me-auto mb-2 mb-lg-0">
            {user && !user.debe_cambiar_password
              ? MENU[user.rol].map(([to, label]) => <NavLink key={to} to={to} end className={linkClass} onClick={() => setAbierto(false)}>{label}</NavLink>)
              : !user && <><NavLink to="/login" className={linkClass} onClick={() => setAbierto(false)}>Ingresar</NavLink><NavLink to="/registro" className={linkClass} onClick={() => setAbierto(false)}>Registrarse</NavLink></>}
          </nav>
          <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 py-2 py-lg-0">
            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              onClick={onToggleTheme}
              aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            >
              {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            </button>
            {user && <>
              <span className="user-identity">
                <span className="user-avatar" aria-hidden="true">{user.nombre?.charAt(0)?.toUpperCase()}</span>
                <span className="user-copy"><strong>{user.nombre}</strong><small>{rolLabel[user.rol] || user.rol}</small></span>
              </span>
              <button className="btn btn-outline-primary btn-sm" type="button" onClick={salir}>Cerrar sesión</button>
            </>}
          </div>
        </div>
      </div>
    </header>
  );
}
