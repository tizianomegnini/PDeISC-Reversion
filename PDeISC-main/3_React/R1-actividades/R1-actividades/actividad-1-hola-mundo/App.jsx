import HolaMundo from "./components/HolaMundo";
import ThemeToggle from "./components/ThemeToggle";
import Navegacion from "./components/Navegacion";

// Página independiente de la Actividad 1: Hola mundo.
function App() {
  return (
    <>
      <header className="header">
        <div className="header-contenido">
          <a href="#" className="logo">
            React<span>.</span>
          </a>

          <span className="logo-actividad">Actividad 1</span>

          <Navegacion actual={1} />

          <ThemeToggle />
        </div>
      </header>

      <main>
        <div className="contenedor">
          <HolaMundo />
        </div>
      </main>

      <footer className="footer">
        <p>
          Trabajo práctico de React · 2026
        </p>

        <p>
          Actividad 1 · localhost:5171
        </p>
      </footer>
    </>
  );
}

export default App;
