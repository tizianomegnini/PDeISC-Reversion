import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import fs from "fs";

const app = express();
const PORT = 3000;

// ==========================================================
// Fix __dirname en ES Modules
// ==========================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================================
// Middlewares
// ==========================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================================
// Conexión MySQL
// ==========================================================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ahorcadoDB'
});

db.connect(err => {
    if (err) {
        console.error('❌ Error MySQL:', err);
    } else {
        console.log('✅ MySQL conectado');
    }
});

// ==========================================================
// GET países
// ==========================================================
app.get('/api/paises', (req, res) => {

    db.query('SELECT nombre FROM paises', (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: 'Error al obtener países'
            });
        }

        const lista = results.map(p =>
            p.nombre
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toUpperCase()
        );

        res.json(lista);

    });

});

// ==========================================================
// POST guardar score
// ==========================================================
app.post('/api/guardar-score', (req, res) => {

    console.log("📥 Recibiendo score");

    const { nombre, puntos } = req.body;

    if (!nombre || puntos == null) {
        return res.status(400).json({
            error: 'Datos incompletos'
        });
    }

    const sql = 'INSERT INTO ranking (nombre, puntaje) VALUES (?, ?)';

    db.query(sql, [nombre, puntos], (err) => {

        if (err) {
            console.error("❌ Error DB:", err);
            return res.status(500).json({
                error: 'Error al guardar'
            });
        }

        res.json({
            ok: true
        });

    });

});

// ==========================================================
// GET ranking TOP 5
// ==========================================================
app.get('/api/top', (req, res) => {

    const sql = 'SELECT nombre, puntaje FROM ranking ORDER BY puntaje DESC LIMIT 5';

    db.query(sql, (err, results) => {

        if (err) {
            console.error("❌ Error DB:", err);
            return res.status(500).json({
                error: 'Error al obtener ranking'
            });
        }

        res.json(results);

    });

});

// ==========================================================
// POST generar PDF
// ==========================================================
app.post('/api/pdf', (req, res) => {

    const { nombre, puntos } = req.body;

    if (!nombre || puntos == null) {
        return res.status(400).json({
            error: 'Datos incompletos'
        });
    }

    const doc = new PDFDocument({
        margin: 50
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=Puntaje_${nombre}.pdf`
    );

    doc.pipe(res);

    // Título
    doc
        .fontSize(24)
        .text('REPORTE DE PUNTAJE', {
            align: 'center'
        });

    doc.moveDown(2);

    // Información del jugador
    doc
        .fontSize(16)
        .text(`Jugador: ${nombre}`);

    doc.moveDown();

    doc.text(`Puntaje: ${puntos}`);

    doc.moveDown();

    doc.text(`Fecha: ${new Date().toLocaleDateString()}`);

    doc.moveDown();

    doc.text(`Hora: ${new Date().toLocaleTimeString()}`);

    doc.moveDown(2);

    doc
        .fontSize(12)
        .text('Gracias por jugar Ahorcado.', {
            align: 'center'
        });

    doc.end();

});
app.post("/Descargas", (req, res) => {
    const { nombre, puntaje } = req.body;

    const fecha = new Date().toLocaleString().replace(/[/:]/g, "-");

    const contenido = `
Jugador: ${nombre}
Puntaje: ${puntaje}
Fecha: ${fecha}
-------------------------
`;

    const nombreArchivo = `descarga_${nombre}_${Date.now()}.txt`;

    fs.writeFile(
        path.join(Descargas, nombreArchivo),
        contenido,
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error al guardar" });
            }

            res.json({ ok: true });
        }
    );
});
// ==========================================================
// INICIAR SERVIDOR
// ==========================================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
});