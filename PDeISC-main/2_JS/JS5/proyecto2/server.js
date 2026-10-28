import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Simulación de base de datos
let alumnos = [
    { id: 1, nombre: 'Juan', apellido: 'Perez', edad: 20 },
    { id: 2, nombre: 'Ana', apellido: 'Gomez', edad: 22 }
];

app.post('/alumnos', (req, res) => {
    const { action } = req.body;
    
    if (action === 'get') {
        res.json(alumnos);
    } else {
        res.status(400).json({ error: 'Acción no válida' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});