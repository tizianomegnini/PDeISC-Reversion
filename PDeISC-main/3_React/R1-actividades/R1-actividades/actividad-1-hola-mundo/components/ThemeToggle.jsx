import { useEffect, useState } from "react";

// Componente encargado de cambiar entre modo claro y oscuro.
function ThemeToggle() {
  // Guarda el estado actual del tema.
  const [modoOscuro, setModoOscuro] = useState(() => {
    // Recupera la preferencia guardada anteriormente.
    return localStorage.getItem("tema") === "oscuro";
  });

  // Cada vez que cambia el tema se actualiza el documento.
  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tema", "oscuro");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tema", "claro");
    }
  }, [modoOscuro]);

  return (
    <button
      className="tema-boton"
      onClick={() => setModoOscuro(!modoOscuro)}
      aria-label="Cambiar tema"
    >
      {modoOscuro ? "☀️" : "🌙"}
      <span>
        {modoOscuro ? "Modo claro" : "Modo oscuro"}
      </span>
    </button>
  );
}

export default ThemeToggle;