import http from 'http';
import { upperCase } from 'upper-case';

const server = http.createServer((req, res) => {

    const texto = 'hola desde ejercicio 4';
    const resultado = upperCase(texto);

    console.log('Resultado:', resultado);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(resultado);
});

server.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});