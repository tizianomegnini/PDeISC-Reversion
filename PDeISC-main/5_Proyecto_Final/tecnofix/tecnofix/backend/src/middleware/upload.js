import { randomUUID } from 'node:crypto';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { HttpError } from '../utils/errors.js';

export const MAX_ADJUNTO_BYTES = 5 * 1024 * 1024;
export const MAX_ADJUNTOS = 1;
const MAX_REQUEST_BYTES = MAX_ADJUNTO_BYTES + 256 * 1024;
export const ADJUNTOS_DIR = path.join(os.tmpdir(), `tecnofix-chat-uploads-${randomUUID()}`);

const TIPOS_PERMITIDOS = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);

function errorAdjunto(status, message) {
  return new HttpError(status, message);
}

function parametroDisposition(disposition, name) {
  const match = disposition.match(new RegExp(`(?:^|;)\\s*${name}="((?:\\\\.|[^"])*)"`));
  return match ? match[1].replace(/\\(.)/g, '$1') : null;
}

function buscarDelimitador(body, delimiter, start) {
  let position = body.indexOf(delimiter, start);
  while (position !== -1) {
    const after = position + delimiter.length;
    if (body.subarray(after, after + 2).equals(Buffer.from('--')) ||
        body.subarray(after, after + 2).equals(Buffer.from('\r\n'))) return position;
    position = body.indexOf(delimiter, position + 1);
  }
  return -1;
}

function validarContenido(file) {
  const extension = path.extname(file.nombreOriginal).toLowerCase();
  const mimeType = TIPOS_PERMITIDOS.get(extension);
  if (!mimeType || file.mimeType !== mimeType) {
    throw errorAdjunto(400, 'Formato de foto no permitido. Enviá una imagen JPG, PNG o WEBP.');
  }
  const bytes = file.buffer;
  const valido = mimeType === 'image/jpeg'
    ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : mimeType === 'image/png'
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : mimeType === 'image/webp'
        ? bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
        : false;
  if (!valido) throw errorAdjunto(400, 'El archivo no coincide con su formato o está dañado.');
  file.categoria = 'foto';
  file.storageKey = randomUUID();
}

function parseMultipart(body, boundary) {
  const opening = Buffer.from(`--${boundary}\r\n`);
  const delimiter = Buffer.from(`\r\n--${boundary}`);
  if (!body.subarray(0, opening.length).equals(opening)) {
    throw errorAdjunto(400, 'El envío de archivos está incompleto o no tiene un formato válido.');
  }

  const files = [];
  let contenido;
  let cursor = opening.length;
  while (cursor <= body.length) {
    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), cursor);
    if (headerEnd === -1) throw errorAdjunto(400, 'El envío de archivos está incompleto.');
    const headers = body.subarray(cursor, headerEnd).toString('latin1');
    const disposition = headers.match(/^content-disposition:\s*form-data;[^\r\n]*$/im)?.[0];
    if (!disposition) throw errorAdjunto(400, 'El formulario de archivos no es válido.');
    const field = parametroDisposition(disposition, 'name');
    const filename = parametroDisposition(disposition, 'filename');
    const dataStart = headerEnd + 4;
    const next = buscarDelimitador(body, delimiter, dataStart);
    if (next === -1) throw errorAdjunto(400, 'El envío de archivos está incompleto.');
    const dataEnd = next;
    const data = body.subarray(dataStart, dataEnd);

    if (filename !== null) {
      if (field !== 'archivos') throw errorAdjunto(400, 'Campo de archivo desconocido.');
      if (!filename) throw errorAdjunto(400, 'Seleccioná un archivo válido.');
      if (files.length >= MAX_ADJUNTOS) throw errorAdjunto(400, 'Podés enviar una foto por mensaje.');
      if (data.length > MAX_ADJUNTO_BYTES) throw errorAdjunto(413, 'Cada archivo debe pesar como máximo 5 MB.');
      const nombreOriginal = path.basename(filename.replace(/\\/g, '/'))
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim()
        .slice(0, 180);
      if (!nombreOriginal) throw errorAdjunto(400, 'El nombre del archivo no es válido.');
      const mimeType = headers.match(/^content-type:\s*([^\r\n]+)/im)?.[1]?.trim().toLowerCase() || '';
      files.push({ nombreOriginal, mimeType, buffer: data });
    } else if (field === 'contenido') {
      if (contenido !== undefined) throw errorAdjunto(400, 'El mensaje contiene campos repetidos.');
      contenido = data.toString('utf8').trim();
      if (contenido.length > 2000) throw errorAdjunto(400, 'El mensaje admite hasta 2000 caracteres.');
    } else {
      throw errorAdjunto(400, 'Campo de formulario desconocido.');
    }

    cursor = next + delimiter.length;
    const final = body.subarray(cursor, cursor + 2).toString('ascii');
    if (final === '--') break;
    if (final !== '\r\n') throw errorAdjunto(400, 'El envío de archivos está incompleto.');
    cursor += 2;
  }

  if (!files.length) throw errorAdjunto(400, 'Seleccioná al menos un archivo.');
  for (const file of files) validarContenido(file);
  return { files, contenido: contenido || '' };
}

export function parseAdjuntos(req, _res, next) {
  const contentType = req.headers['content-type'] || '';
  const boundary = contentType.match(/^multipart\/form-data\s*;.*\bboundary=(?:"([^"]+)"|([^;\s]+))/i);
  if (!boundary) return next(errorAdjunto(400, 'El formulario de archivos no tiene un formato válido.'));
  const boundaryValue = boundary[1] || boundary[2];
  if (boundaryValue.length > 70 || /[^\x20-\x7e]/.test(boundaryValue)) {
    return next(errorAdjunto(400, 'El formulario de archivos no tiene un formato válido.'));
  }

  const chunks = [];
  let size = 0;
  let terminado = false;
  req.on('data', (chunk) => {
    if (terminado) return;
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) {
      terminado = true;
      chunks.length = 0;
      req.resume();
      next(errorAdjunto(413, 'La foto supera el tamaño permitido de 5 MB.'));
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (terminado) return;
    try {
      Object.assign(req, { adjuntos: parseMultipart(Buffer.concat(chunks), boundaryValue) });
      next();
    } catch (error) {
      next(error);
    }
  });
  req.on('error', (error) => {
    if (!terminado) next(error);
  });
}

export async function guardarAdjuntosTemporales(files) {
  await mkdir(ADJUNTOS_DIR, { recursive: true });
  const guardados = [];
  try {
    for (const file of files) {
      const ruta = path.join(ADJUNTOS_DIR, file.storageKey);
      await writeFile(ruta, file.buffer, { flag: 'wx', mode: 0o600 });
      guardados.push({ ...file, ruta });
    }
    return guardados;
  } catch (error) {
    await Promise.all(guardados.map((file) => unlink(file.ruta)));
    throw error;
  }
}

export async function eliminarAdjuntosTemporales(files) {
  await Promise.all(files.map(async (file) => {
    try { await unlink(file.ruta); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }));
}

export async function adjuntoDisponible(storageKey) {
  try {
    await access(path.join(ADJUNTOS_DIR, storageKey));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
