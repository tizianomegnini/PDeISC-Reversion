import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3004;

// 🛠️ Reemplazo de __dirname para que funcione con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeo estático directo
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// Ruta principal (Sirve page.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'page.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Express con ES Modules corriendo en: http://localhost:${PORT}`);
});