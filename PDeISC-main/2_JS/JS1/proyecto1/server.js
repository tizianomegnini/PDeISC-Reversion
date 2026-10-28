import http from "http";
import fs from "fs";

let usuarios = [];

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === "GET" && url === "/") {
    fs.readFile("./pag/index.html", (err, data) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  if (method === "GET" && url === "/scripts/app.js") {
    fs.readFile("./scripts/app.js", (err, data) => {
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(data);
    });
    return;
  }

  if (method === "GET" && url === "/styles/style.css") {
    fs.readFile("./styles/style.css", (err, data) => {
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(data);
    });
    return;
  }

  if (method === "POST" && url === "/agregar") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      usuarios.push(JSON.parse(body));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  if (method === "GET" && url === "/usuarios") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(usuarios));
    return;
  }
});

server.listen(3001, () => {
  console.log("🚀 Sistema Financiero iniciado en: http://localhost:3001");
});