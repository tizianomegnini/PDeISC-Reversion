// Mismas reglas que el backend (backend/routes/auth.js), para dar el error
// enseguida en el formulario en vez de esperar la respuesta del servidor.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const reglaEmail = {
  required: 'El email es obligatorio',
  setValueAs: (v) => (typeof v === 'string' ? v.trim() : v),
  pattern: { value: EMAIL_RE, message: 'Ingresá un email válido' },
  maxLength: { value: 150, message: 'Máximo 150 caracteres' },
};

export const reglaNombre = {
  required: 'El nombre es obligatorio',
  setValueAs: (v) => (typeof v === 'string' ? v.trim() : v),
  maxLength: { value: 100, message: 'Máximo 100 caracteres' },
};
