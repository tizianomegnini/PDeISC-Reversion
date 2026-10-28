import './ejercicio4.js'; // ejecuta el ejercicio

import http from 'http';

const server = http.createServer((req, res) => {
    res.end("Ejercicio 4 ejecutado. Mirá la consola.");
});

server.listen(3000, () => {
    console.log('Servidor en http://localhost:3000');
});