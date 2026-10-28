import { createContext, useContext, useEffect, useState, useCallback } from "react";

/**
 * ThemeContext
 * ------------
 * Maneja el modo claro/oscuro de toda la aplicación.
 *
 * Estrategia:
 * 1. Al montar, lee el tema ya aplicado por el script inline de index.html
 *    (evita el "flash" de color incorrecto en la primera pintura).
 * 2. Expone `theme` y `toggleTheme` a través de un hook `useTheme()`.
 * 3. Cada cambio de tema se persiste en localStorage y se refleja en el
 *    atributo `data-theme` de <html>, que es lo que consume src/index.css.
 */

const ThemeContext = createContext(null);
const STORAGE_KEY = "portfolio-theme";

function getInitialTheme() {
  if (typeof document !== "undefined") {
    const fromDom = document.documentElement.getAttribute("data-theme");
    if (fromDom === "light" || fromDom === "dark") return fromDom;
  }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Sincroniza el DOM y localStorage cada vez que cambia el estado "theme".
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage puede fallar en navegación privada; no es crítico.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

/** Hook de conveniencia para consumir el contexto de tema. */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
