import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simular __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear servidor
const server = http.createServer((req, res) => {

    // Ruta al HTML dentro de /pages
    const filePath = path.join(__dirname, 'pages', 'PaginaDePrueba.html');

    fs.readFile(filePath, (err, data) => {

        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error al cargar el HTML');
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});