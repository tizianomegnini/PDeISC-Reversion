import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 👇 ESTO SOLUCIONA TODO
app.use(express.static(__dirname));

// (lo demás lo podés dejar o no, ya no es necesario)
app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use("/styles", express.static(path.join(__dirname, "styles")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pags", "index.html"));
});

app.listen(3003, () => {
  console.log("Servidor corriendo en http://localhost:3003");
});