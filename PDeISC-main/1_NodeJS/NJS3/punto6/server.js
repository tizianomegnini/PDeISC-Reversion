import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3005;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'page.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Express (Punto 6) corriendo en: http://localhost:${PORT}`);
});