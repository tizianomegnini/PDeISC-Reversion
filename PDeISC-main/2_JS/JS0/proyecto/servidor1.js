import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = 3000;

// Configuración de rutas usando ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diccionario de MIME Types para que el navegador interprete correctamente los recursos
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'text/javascript'
};

const server = http.createServer(async (req, res) => {
    let filePath = '';

    // 🗺️ ENRUTADOR MANUAL
    if (req.url === '/' || req.url === '/index.html') {
        // Ruta raíz: Servimos el html de la carpeta pags
        filePath = path.join(__dirname, 'pags', 'ejercicio1.html');
    } else if (req.url.startsWith('/scripts/') || req.url.startsWith('/styles/')) {
        // Rutas estáticas: Mapeamos directamente al sistema de archivos
        filePath = path.join(__dirname, req.url);
    } else {
        // 404 si piden cualquier otra cosa
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('❌ 404 Not Found - Recurso no encontrado en el laboratorio');
        return;
    }

    // 📦 LECTURA Y DESPACHO DEL ARCHIVO
    try {
        // Detectar extensión y asignar su MIME Type correspondiente
        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        // Leer el archivo de forma asincrónica limpia
        const data = await fs.readFile(filePath);
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (error) {
        // Si el archivo físicamente no existe en el disco, tiramos un 500 o 404
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('🔥 500 Internal Server Error - Error al leer el archivo en el servidor');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor PURE HTTP (Sin Express) corriendo en: http://localhost:${PORT}`);
});