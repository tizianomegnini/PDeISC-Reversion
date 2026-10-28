import express from 'express';
import cors from 'cors';
import { PUERTO, CORS_ORIGINS, validarConfiguracion } from './config.js';
import { inicializarBD, explicarErrorDB } from './db.js';
import authRoutes from './routes/auth.js';

validarConfiguracion();

const app = express();

app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Ruta inexistente -> JSON (no la página HTML por defecto de Express)
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejador global de errores. Sin esto, un JSON mal formado devolvía una
// página HTML con el stack trace y las rutas internas del servidor.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La petición es demasiado grande' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function arrancar() {
  try {
    await inicializarBD();
    console.log('✅ Base de datos lista');
  } catch (err) {
    console.error(`❌ No se pudo preparar la base de datos:\n   ${explicarErrorDB(err)}`);
    console.error('   Corregí backend/.env y volvé a ejecutar el backend.');
    process.exit(1);
  }

  const servidor = app.listen(PUERTO, () =>
    console.log(`✅ API escuchando en http://localhost:${PUERTO}`)
  );

  servidor.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ El puerto ${PUERTO} ya está en uso (¿ya hay un backend corriendo?). Cerralo o cambiá PORT en .env.`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

arrancar();
