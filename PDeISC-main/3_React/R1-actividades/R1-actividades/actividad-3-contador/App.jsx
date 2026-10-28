import Contador from "./components/Contador";
import ThemeToggle from "./components/ThemeToggle";
import Navegacion from "./components/Navegacion";

// Página independiente de la Actividad 3: Contador.
function App() {
  return (
    <>
      <header className="header">
        <div className="header-contenido">
          <a href="#" className="logo">
            React<span>.</span>
          </a>

          <span className="logo-actividad">Actividad 3</span>

          <Navegacion actual={3} />

          <ThemeToggle />
        </div>
      </header>

      <main>
        <div className="contenedor">
          <Contador />
        </div>
      </main>

      <footer className="footer">
        <p>
          Trabajo práctico de React · 2026
        </p>

        <p>
          Actividad 3 · localhost:5173
        </p>
      </footer>
    </>
  );
}

export default App;
