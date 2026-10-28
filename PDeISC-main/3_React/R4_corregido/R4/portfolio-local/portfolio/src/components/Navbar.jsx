import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useScrollInfo } from "../hooks/useScrollInfo";
import "../styles/navbar.css";

const LINKS = [
  { id: "sobre-mi", label: "Sobre mí" },
  { id: "habilidades", label: "Habilidades" },
  { id: "experiencia", label: "Experiencia" },
  { id: "logros", label: "Logros" },
  { id: "proyectos", label: "Proyectos" },
  { id: "contacto", label: "Contacto" },
];

/**
 * Navbar
 * ------
 * Barra de navegación fija. Usa:
 *  - useState para controlar el menú móvil (evento onClick del botón hamburguesa).
 *  - useScrollInfo (hook propio, basado en el evento "scroll") para aplicar
 *    el fondo con blur al bajar la página y resaltar el link de la sección activa.
 */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const sectionIds = LINKS.map((l) => l.id);
  const { scrolled, activeId } = useScrollInfo(sectionIds);

  function handleLinkClick() {
    setMenuOpen(false);
  }

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <nav className="container navbar__inner" aria-label="Navegación principal">
        <a href="#inicio" className="navbar__brand">
          Tiziano Riquelme Portfolio
        </a>

        <ul className={`navbar__links ${menuOpen ? "navbar__links--open" : ""}`}>
          {LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={`navbar__link ${activeId === link.id ? "navbar__link--active" : ""}`}
                onClick={handleLinkClick}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="navbar__actions">
          <ThemeToggle />
          <button
            type="button"
            className="navbar__menu-btn"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>
    </header>
  );
}
