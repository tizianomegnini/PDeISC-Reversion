import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// arreglo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// servidor
const server = http.createServer((req, res) => {

    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

    let ext = path.extname(filePath);

    let contentType = 'text/html';

    if (ext === '.js') contentType = 'text/javascript';
    if (ext === '.css') contentType = 'text/css';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.log("ERROR:", err); // para debug
            res.writeHead(404);
            res.end('Archivo no encontrado');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(3000, () => {
    console.log('Servidor en http://localhost:3000');
});