import http from 'http';
// Importamos readdir y stat para poder auditar la carpeta 'date'
import { writeFile, readFile, mkdir, readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer(async (req, res) => {
    const { method, url } = req;

    // --- 1. MANEJO DE PETICIONES GET ---
    if (method === 'GET') {
        // RUTA NUEVA: Obtener lista del historial en formato JSON
        if (url === '/historial') {
            try {
                const folderPath = path.join(__dirname, 'date');
                await mkdir(folderPath, { recursive: true });
                const files = await readdir(folderPath);
                
                const history = [];
                for (const file of files) {
                    if (file.endsWith('.txt')) {
                        const filePath = path.join(folderPath, file);
                        const fileStats = await stat(filePath);
                        history.push({
                            name: file,
                            date: fileStats.birthtime // Fecha de creación física
                        });
                    }
                }
                // Ordenar del más nuevo al más viejo
                history.sort((a, b) => b.date - a.date);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(history));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ message: 'Error al leer el historial' }));
            }
            return;
        }

        // RUTA NUEVA: Descargar un archivo específico del historial
        if (url.startsWith('/descargar-historial?file=')) {
            const fileName = new URL(url, `http://${req.headers.host}`).searchParams.get('file');
            // Protección básica contra Path Traversal (evita hackeos de carpetas)
            if (fileName && !fileName.includes('..') && fileName.endsWith('.txt')) {
                const filePath = path.join(__dirname, 'date', fileName);
                try {
                    const content = await readFile(filePath);
                    res.writeHead(200, { 
                        'Content-Type': 'text/plain',
                        'Content-Disposition': `attachment; filename=${fileName}` 
                    });
                    res.end(content);
                } catch {
                    res.writeHead(404);
                    res.end('Archivo no encontrado');
                }
            } else {
                res.writeHead(400);
                res.end('Solicitud inválida');
            }
            return;
        }

        // Servidor estático base (HTML, CSS, JS)
        let filePath = url === '/' ? path.join(__dirname, 'pag', 'index.html') : path.join(__dirname, url);
        try {
            const content = await readFile(filePath);
            const ext = path.extname(filePath);
            const contentType = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[ext] || 'text/plain';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } catch {
            res.writeHead(404);
            res.end('Not Found');
        }
        return;
    }

    // --- 2. MANEJO DE PETICIONES POST ---
    if (method === 'POST' && url === '/exportar-filtrado') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { reporte } = JSON.parse(body);
                
                // Generamos un nombre único usando la estampa de tiempo exacta (Timestamp)
                const uniqueId = Date.now();
                const baseFileName = `reporte_${uniqueId}.txt`;
                
                const folderPath = path.join(__dirname, 'date');
                const filePathTarget = path.join(folderPath, baseFileName);
                
                await mkdir(folderPath, { recursive: true });
                await writeFile(filePathTarget, reporte);
                
                res.writeHead(200, { 
                    'Content-Type': 'text/plain',
                    'Content-Disposition': `attachment; filename=${baseFileName}` 
                });
                res.end(reporte);
            } catch (error) {
                console.error("Error al procesar el reporte:", error);
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Error al exportar' }));
            }
        });
    }
});

server.listen(3001, () => console.log('🚀 Proyecto con Historial en http://localhost:3001'));