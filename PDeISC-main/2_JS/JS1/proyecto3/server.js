import http from "http";
import fs from "fs";
import path from "path";

let empleadosArray = []; 

const server = http.createServer((req, res) => {
  const { url, method } = req;

  if (method === "GET") {
    let filePath = url === "/" ? "./pag/index.html" : `.${url}`;
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
      } else {
        res.writeHead(200);
        res.end(data);
      }
    });
  } 
  
  else if (url === "/api/empleados" && method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const nuevoEmp = JSON.parse(body);
      empleadosArray.push(nuevoEmp);
      res.writeHead(201);
      res.end(JSON.stringify({ status: "success" }));
    });
  }
});

server.listen(3003, () => console.log("🚀 Empresa X - RRHH: http://localhost:3003"));