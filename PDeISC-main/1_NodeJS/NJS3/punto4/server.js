const express = require('express');
const path = require('path');
const app = express();
const PORT = 3003;

// 📁 Mapeo de carpetas estáticas directas según tu estructura
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// 🏠 Ruta principal: sirve 'page.html' desde la carpeta 'pages'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'page.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Express corriendo en: http://localhost:${PORT}`);
});