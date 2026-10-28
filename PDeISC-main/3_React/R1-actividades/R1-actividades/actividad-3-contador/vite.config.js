import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Esta actividad corre siempre en http://localhost:5173
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // si el puerto está ocupado, avisa en vez de cambiarlo
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
});
