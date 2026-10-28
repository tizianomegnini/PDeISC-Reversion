import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Necesario para usar __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "pag")));
app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use("/styles", express.static(path.join(__dirname, "styles")));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pags", "index.html"));
});

app.listen(3002, () => {
  console.log("Servidor corriendo en http://localhost:3002");
});