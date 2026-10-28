import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto fijo: el backend solo acepta (CORS) los puertos 5173 y 5174.
// strictPort hace que falle con un mensaje claro si está ocupado, en vez de
// saltar en silencio a otro puerto que el backend rechazaría.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
