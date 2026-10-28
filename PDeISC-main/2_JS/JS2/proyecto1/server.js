import http from 'http';
import { writeFile, readFile, readdir, mkdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATE_DIR = path.join(__dirname, 'date');

// Asegurar que la carpeta 'date' exista al arrancar
try { await mkdir(DATE_DIR, { recursive: true }); } catch (err) { console.error(err); }

const server = http.createServer(async (req, res) => {
    const { method, url } = req;

    // 1. MANEJO DE ARCHIVOS ESTÁTICOS (GET)
    if (method === 'GET' && !url.startsWith('/historial') && !url.startsWith('/descargar-historial')) {
        let filePath = url === '/' ? path.join(__dirname, 'pag', 'index.html') : path.join(__dirname, url);
        try {
            const data = await readFile(filePath);
            const ext = path.extname(filePath);
            const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[ext] || 'text/plain';
            res.writeHead(200, { 'Content-Type': type });
            res.end(data);
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('No encontrado');
        }
        return;
    }

    // 2. ENDPOINT PARA OBTENER EL HISTORIAL (GET /historial)
    if (method === 'GET' && url === '/historial') {
        try {
            const archivos = await readdir(DATE_DIR);
            const listaArchivos = await Promise.all(
                archivos.filter(file => file.endsWith('.txt')).map(async file => {
                    const info = await stat(path.join(DATE_DIR, file));
                    return { name: file, date: info.mtime };
                })
            );
            // Ordenar los más recientes primero
            listaArchivos.sort((a, b) => b.date - a.date);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(listaArchivos));
        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Error al leer el historial' }));
        }
        return;
    }

    // 3. ENDPOINT PARA DESCARGAR DESDE EL HISTORIAL
    if (method === 'GET' && url.startsWith('/descargar-historial')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const fileName = urlParams.searchParams.get('file');
        if (!fileName) {
            res.writeHead(400); res.end('Falta el nombre del archivo');
            return;
        }
        try {
            const safePath = path.join(DATE_DIR, path.basename(fileName));
            const data = await readFile(safePath);
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Content-Disposition': `attachment; filename=${fileName}`
            });
            res.end(data);
        } catch {
            res.writeHead(404); res.end('Archivo no encontrado');
        }
        return;
    }

    // 4. GUARDAR NUEVO REPORTE (POST /guardar)
    if (method === 'POST' && url === '/guardar') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { datos } = JSON.parse(body);
                
                let contenido = `REPORTE DE DATOS - INCIZO NUMÉRICOS\n`;
                contenido += "=".repeat(45) + "\n";
                datos.forEach((d, i) => {
                    contenido += `Registro [${i + 1}]: Valor = ${d.valor} | Carga: ${d.fecha}\n`;
                });

                // Cambiado para generar nombres únicos y guardarlos en /date
                const uniqueName = `reporte_${Date.now()}.txt`;
                await writeFile(path.join(DATE_DIR, uniqueName), contenido);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, fileName: uniqueName }));
            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Error procesando datos' }));
            }
        });
        return;
    }
});

server.listen(3000, () => console.log('🚀 Server Proyecto 1 listo: http://localhost:3000'));