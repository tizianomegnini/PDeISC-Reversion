import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración estándar de Vite para un proyecto React SPA.
// No se requieren ajustes especiales: Vercel/Netlify detectan
// automáticamente "npm run build" -> carpeta "dist".
export default defineConfig({
  plugins: [react()],
});
