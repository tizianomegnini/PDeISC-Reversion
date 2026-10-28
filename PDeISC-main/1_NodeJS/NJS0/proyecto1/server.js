import './ejercicio1.js'; // ejecuta el ejercicio

import http from 'http';

const server = http.createServer((req, res) => {
    res.end("Ejercicio 1 ejecutado. Mirá la consola.");
});

server.listen(3000, () => {
    console.log('Servidor en http://localhost:3000');
});