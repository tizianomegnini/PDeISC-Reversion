import { saludar, calcular, menu } from "../modules/funciones.js";
import { upperCase } from "upper-case";
import fs from "fs";

function plantilla(titulo, contenido) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${titulo}</title>

        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>

    <body class="bg-light">

        ${menu()}

        <div class="container mt-5">
            <div class="card shadow p-4">
                ${contenido}
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    `;
}

export function inicio() {
    return plantilla("Inicio", `
        <h1 class="mb-3">Bienvenido 👋</h1>
        <p class="lead">${saludar("Tiziano")}</p>
    `);
}

export function clima() {
    return plantilla("Clima", `
        <h1>Clima</h1>
        <p>Hoy está soleado ☀️</p>
    `);
}

export function calculo() {
    return plantilla("Cálculo", `
        <h1>Cálculo</h1>
        <p>Resultado: <strong>${calcular(5, 3)}</strong></p>
    `);
}

export function mayus() {
    return plantilla("Mayúsculas", `
        <h1>UpperCase</h1>
        <p>${upperCase("hola mundo")}</p>
    `);
}

export function archivo() {
    let texto = "No se pudo leer el archivo";

    try {
        texto = fs.readFileSync("texto.txt", "utf-8");
    } catch {}

    return plantilla("Archivo", `
        <h1>Archivo</h1>
        <p>${texto}</p>
    `);
}

export function urlInfo(urlObj) {
    console.log("HOST:", urlObj.host);
    console.log("PATH:", urlObj.pathname);

    return plantilla("URL", `
        <h1>URL</h1>
        <p>Revisá la consola 👀</p>
    `);
}