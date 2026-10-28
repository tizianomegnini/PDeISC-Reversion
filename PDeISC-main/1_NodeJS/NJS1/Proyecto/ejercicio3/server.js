import http from 'http';
import { URL } from 'url';

const server = http.createServer((req, res) => {

    const baseURL = `http://${req.headers.host}`;
    const myURL = new URL(req.url, baseURL);

    console.log('Host:', myURL.host);
    console.log('Path:', myURL.pathname);
    console.log('URL completa:', myURL.href);

    myURL.searchParams.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});