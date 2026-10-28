import http from "http";
import url from "url";

import {inicio,clima,calculo,mayus,archivo,urlInfo} from "./scripts/page.js";
import {  saludar, calcular, menu } from "../ejercicio5/modules/funciones.js"; 

const server = http.createServer((req, res) => {
    const urlObj = url.parse(req.url, true);

    res.writeHead(200, { "Content-Type": "text/html" });

    switch (urlObj.pathname) {
        case "/":
            res.end(inicio());
            break;
        case "/clima":
            res.end(clima());
            break;
        case "/calculo":
            res.end(calculo());
            break;
        case "/mayus":
            res.end(mayus());
            break;
        case "/archivo":
            res.end(archivo());
            break;
        case "/url":
            res.end(urlInfo(urlObj));
            break;
        default:
            res.end("<h1>404 Not Found</h1>");
    }
});

server.listen(3000, () => {
    console.log("Servidor en http://localhost:3000");
});