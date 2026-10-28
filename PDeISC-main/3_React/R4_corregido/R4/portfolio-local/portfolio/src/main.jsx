import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { EditModeProvider } from "./context/EditModeContext";
import "./index.css";

// ThemeProvider: modo claro/oscuro (useTheme).
// EditModeProvider: contraseña de edición y qué editor está abierto
// (useEditMode) — reemplaza a la vieja página /admin.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <EditModeProvider>
        <App />
      </EditModeProvider>
    </ThemeProvider>
  </React.StrictMode>
);
