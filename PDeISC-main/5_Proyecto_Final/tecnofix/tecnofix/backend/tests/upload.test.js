import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { parseAdjuntos } from '../src/middleware/upload.js';

function parte(boundary, headers, contenido) {
  return Buffer.concat([
    Buffer.from(`--${boundary}\r\n${headers}\r\n\r\n`),
    Buffer.isBuffer(contenido) ? contenido : Buffer.from(contenido),
    Buffer.from('\r\n'),
  ]);
}

function parsear(body, boundary) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.headers = { 'content-type': `multipart/form-data; boundary=${boundary}` };
    req.resume = () => {};
    parseAdjuntos(req, {}, (error) => error ? reject(error) : resolve(req.adjuntos));
    req.emit('data', body);
    req.emit('end');
  });
}

test('parsea mensajes con fotos y sanea el nombre proporcionado', async () => {
  const boundary = 'limite-prueba';
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const body = Buffer.concat([
    parte(boundary, 'Content-Disposition: form-data; name="contenido"', 'Mirá esta foto'),
    parte(boundary, 'Content-Disposition: form-data; name="archivos"; filename="../../equipo.png"\r\nContent-Type: image/png', png),
    Buffer.from(`--${boundary}--\r\n`),
  ]);
  const resultado = await parsear(body, boundary);
  assert.equal(resultado.contenido, 'Mirá esta foto');
  assert.equal(resultado.files.length, 1);
  assert.equal(resultado.files[0].nombreOriginal, 'equipo.png');
  assert.equal(resultado.files[0].categoria, 'foto');
});

test('rechaza documentos y contenido que no sean fotos permitidas', async () => {
  const boundary = 'limite-prueba';
  const body = Buffer.concat([
    parte(boundary, 'Content-Disposition: form-data; name="archivos"; filename="documento.pdf"\r\nContent-Type: application/pdf', '%PDF-1.7'),
    Buffer.from(`--${boundary}--\r\n`),
  ]);
  await assert.rejects(parsear(body, boundary), { status: 400 });
});

test('rechaza más de una foto por mensaje', async () => {
  const boundary = 'limite-prueba';
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const body = Buffer.concat([
    parte(boundary, 'Content-Disposition: form-data; name="archivos"; filename="foto-1.png"\r\nContent-Type: image/png', png),
    parte(boundary, 'Content-Disposition: form-data; name="archivos"; filename="foto-2.png"\r\nContent-Type: image/png', png),
    Buffer.from(`--${boundary}--\r\n`),
  ]);
  await assert.rejects(parsear(body, boundary), { status: 400 });
});

test('rechaza fotos que exceden el límite individual', async () => {
  const boundary = 'limite-prueba';
  const png = Buffer.alloc(5 * 1024 * 1024 + 1);
  png.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const body = Buffer.concat([
    parte(boundary, 'Content-Disposition: form-data; name="archivos"; filename="equipo.png"\r\nContent-Type: image/png', png),
    Buffer.from(`--${boundary}--\r\n`),
  ]);
  await assert.rejects(parsear(body, boundary), { status: 413 });
});
