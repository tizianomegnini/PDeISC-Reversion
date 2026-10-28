import ListaTareas from "./components/ListaTareas";
import ThemeToggle from "./components/ThemeToggle";
import Navegacion from "./components/Navegacion";

// Página independiente de la Actividad 4: Lista de tareas.
function App() {
  return (
    <>
      <header className="header">
        <div className="header-contenido">
          <a href="#" className="logo">
            React<span>.</span>
          </a>

          <span className="logo-actividad">Actividad 4</span>

          <Navegacion actual={4} />

          <ThemeToggle />
        </div>
      </header>

      <main>
        <div className="contenedor">
          <ListaTareas />
        </div>
      </main>

      <footer className="footer">
        <p>
          Trabajo práctico de React · 2026
        </p>

        <p>
          Actividad 4 · localhost:5174
        </p>
      </footer>
    </>
  );
}

export default App;
