import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Permite peticiones desde tu archivo HTML local

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'alumnosDB'
});

// ÚNICA RUTA: POST /alumnos para todo
app.post('/alumnos', async (req, res) => {
    const { action, nombre, apellido, edad, id } = req.body;

    try {
        if (action === 'get') {
            // Lógica para obtener alumnos
            const [rows] = await pool.query('SELECT * FROM alumnos');
            res.json(rows);

        } else if (action === 'add') {
            // Lógica para agregar
            await pool.query(
                'INSERT INTO alumnos (nombre, apellido, edad) VALUES (?, ?, ?)',
                [nombre, apellido, edad]
            );
            res.status(201).json({ status: 'ok' });

        } else if (action === 'delete') {
            // Lógica para eliminar
            await pool.query('DELETE FROM alumnos WHERE id = ?', [id]);
            res.status(200).json({ status: 'ok' });

        } else {
            res.status(400).json({ error: 'Acción no reconocida' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Servidor activo en puerto 3000');
    console.log('Nota: Abre index.html directamente en tu navegador, no entres a localhost:3000');
});