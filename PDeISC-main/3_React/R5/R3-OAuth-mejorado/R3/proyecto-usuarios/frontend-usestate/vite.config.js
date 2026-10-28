import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto fijo distinto al de frontend-router para poder correr los dos a la vez.
// El backend acepta (CORS) los puertos 5173 y 5174.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
});
