'use strict';

const { z } = require('zod');

const ROLES = ['administrador', 'medico', 'enfermera', 'secretaria'];

const crearUsuarioSchema = z.object({
  nombreCompleto: z.string().min(2, 'Nombre requerido').max(200),
  email: z.email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  rol: z.enum(ROLES, { message: 'Rol inválido' }),
  numeroColegiado: z.string().max(20).optional(),
  telefono: z.string().max(20).optional(),
});

const editarUsuarioSchema = z.object({
  nombreCompleto: z.string().min(2).max(200).optional(),
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  rol: z.enum(ROLES).optional(),
  numeroColegiado: z.string().max(20).optional(),
  telefono: z.string().max(20).optional(),
  activo: z.boolean().optional(),
});

module.exports = { crearUsuarioSchema, editarUsuarioSchema };
