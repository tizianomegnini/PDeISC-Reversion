import http from "http";
import fs from "fs";

let productos = []; 

const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;

  if (method === "GET") {
    let filePath = url === "/" ? "./pag/index.html" : `.${url}`;
    let contentType = url.endsWith(".js") ? "application/javascript" : "text/html";

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("No encontrado");
      } else {
        res.writeHead(200, { "Content-Type": `${contentType}; charset=utf-8` });
        res.end(data);
      }
    });
    return;
  }

  if (url === "/api/guardar" && method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      productos.push(JSON.parse(body));
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    });
    return;
  }
});

server.listen(3002, () => console.log("🚀 http://localhost:3002"));