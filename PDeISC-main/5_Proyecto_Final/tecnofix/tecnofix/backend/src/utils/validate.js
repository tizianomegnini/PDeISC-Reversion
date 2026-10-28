import { z } from 'zod';
import { badRequest } from './errors.js';

export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) {
    const details = r.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
    throw badRequest(details[0] ? `${details[0].campo ? details[0].campo + ': ' : ''}${details[0].mensaje}` : 'Datos inválidos', details);
  }
  return r.data;
}

const texto = (min, max, nombre) =>
  z.string({ required_error: `${nombre} es obligatorio`, invalid_type_error: `${nombre} debe ser texto` })
    .trim().min(min, `${nombre} es obligatorio`).max(max, `${nombre} admite hasta ${max} caracteres`);
const equipoOpcional = (max) =>
  z.string({ invalid_type_error: 'El dato del equipo debe ser texto' })
    .trim().max(max).optional().transform((v) => v || 'No identificado');

export const passwordSchema = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña admite hasta 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

export const emailSchema = z.string({ required_error: 'El email es obligatorio' }).trim().toLowerCase().email('Email inválido').max(190);
const telefono = z.string().trim().max(40).regex(/^[0-9+()\-\s]*$/, 'Teléfono inválido').optional().nullable().transform((v) => v || null);

export const schemas = {
  register: z.object({
    nombre: texto(1, 80, 'El nombre'), apellido: texto(1, 80, 'El apellido'),
    email: emailSchema, telefono, password: passwordSchema,
  }),
  login: z.object({ email: emailSchema, password: z.string().min(1, 'La contraseña es obligatoria').max(200) }),
  updateProfile: z.object({ nombre: texto(1, 80, 'El nombre'), apellido: texto(1, 80, 'El apellido'), telefono }),
  changePassword: z.object({ actual: z.string().min(1, 'Ingrese su contraseña actual'), nueva: passwordSchema }),
  consulta: z.object({
    tipo_equipo: equipoOpcional(60), marca: equipoOpcional(60),
    modelo: equipoOpcional(80), descripcion: texto(10, 2000, 'La descripción'),
  }),
  estado: z.object({ estado: z.enum(['en_proceso', 'esperando_cliente', 'finalizada', 'cancelada']) }),
  mensaje: z.object({ contenido: texto(1, 2000, 'El mensaje') }),
  valoracion: z.object({
    estrellas: z.number({ invalid_type_error: 'Las estrellas deben ser un número', required_error: 'Indique las estrellas' }).int().min(1, 'Mínimo 1 estrella').max(5, 'Máximo 5 estrellas'),
    comentario: z.string().trim().max(500).optional().nullable().transform((v) => v || null),
  }),
  tecnicoCrear: z.object({
    nombre: texto(1, 80, 'El nombre'), apellido: texto(1, 80, 'El apellido'), email: emailSchema, telefono,
    local_id: z.number().int().positive('Seleccione un local'),
    especialidad: z.string().trim().max(120).optional().nullable().transform((v) => v || null),
    limite_consultas: z.number().int().min(0).max(1000).optional(),
    password: passwordSchema.optional(),
  }),
  tecnicoEditar: z.object({
    nombre: texto(1, 80, 'El nombre').optional(), apellido: texto(1, 80, 'El apellido').optional(),
    telefono: telefono.optional(), local_id: z.number().int().positive().optional(),
    especialidad: z.string().trim().max(120).optional().nullable(),
    limite_consultas: z.number().int().min(0).max(1000).optional(),
    habilitado: z.boolean().optional(),
  }),
  tecnicoPassword: z.object({ password: passwordSchema }),
  local: z.object({
    nombre: texto(2, 100, 'El nombre'), direccion: texto(2, 200, 'La dirección'),
    ciudad: texto(2, 100, 'La ciudad'), telefono, activo: z.boolean().optional(),
  }),
  config: z.object({ limite_consultas_default: z.number().int().min(1).max(1000) }),
};

export const idParam = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw badRequest('Identificador inválido');
  return n;
};
