import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Punto de entrada de la aplicación React.
// Renderiza el componente App dentro del elemento root del HTML.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);