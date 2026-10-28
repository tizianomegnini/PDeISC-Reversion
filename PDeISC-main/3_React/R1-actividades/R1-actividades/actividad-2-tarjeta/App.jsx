import TarjetaPresentacion from "./components/TarjetaPresentacion";
import ThemeToggle from "./components/ThemeToggle";
import Navegacion from "./components/Navegacion";

// Página independiente de la Actividad 2: Tarjeta de presentación.
function App() {
  return (
    <>
      <header className="header">
        <div className="header-contenido">
          <a href="#" className="logo">
            React<span>.</span>
          </a>

          <span className="logo-actividad">Actividad 2</span>

          <Navegacion actual={2} />

          <ThemeToggle />
        </div>
      </header>

      <main>
        <div className="contenedor">
          <TarjetaPresentacion
            nombre="Tiziano"
            apellido="Riquelme"
            profesion="Técnico informático"
            imagen="Img/image.png"
          />
        </div>
      </main>

      <footer className="footer">
        <p>
          Trabajo práctico de React · 2026
        </p>

        <p>
          Actividad 2 · localhost:5172
        </p>
      </footer>
    </>
  );
}

export default App;
