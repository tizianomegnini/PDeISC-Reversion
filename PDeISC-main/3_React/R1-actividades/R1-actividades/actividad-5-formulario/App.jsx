import Formulario from "./components/Formulario";
import ThemeToggle from "./components/ThemeToggle";
import Navegacion from "./components/Navegacion";

// Página independiente de la Actividad 5: Formulario simple.
function App() {
  return (
    <>
      <header className="header">
        <div className="header-contenido">
          <a href="#" className="logo">
            React<span>.</span>
          </a>

          <span className="logo-actividad">Actividad 5</span>

          <Navegacion actual={5} />

          <ThemeToggle />
        </div>
      </header>

      <main>
        <div className="contenedor">
          <Formulario />
        </div>
      </main>

      <footer className="footer">
        <p>
          Trabajo práctico de React · 2026
        </p>

        <p>
          Actividad 5 · localhost:5175
        </p>
      </footer>
    </>
  );
}

export default App;
