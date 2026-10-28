export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export const badRequest = (m, d) => new HttpError(400, m, d);
export const unauthorized = (m = 'No autenticado') => new HttpError(401, m);
export const forbidden = (m = 'No tiene permisos para esta acción') => new HttpError(403, m);
export const notFound = (m = 'No encontrado') => new HttpError(404, m);
export const conflict = (m) => new HttpError(409, m);

// Wrapper para handlers async (Express 4 no captura promesas rechazadas)
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
