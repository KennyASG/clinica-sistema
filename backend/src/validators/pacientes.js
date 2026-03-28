'use strict';

const { z } = require('zod');

const SEXO = ['masculino', 'femenino', 'otro'];

const crearPacienteSchema = z.object({
  nombreCompleto:      z.string().min(2).max(200),
  dpi:                 z.string().min(13).max(15).regex(/^\d+$/, 'DPI debe contener solo dígitos'),
  fechaNacimiento:     z.string().date('Fecha inválida (YYYY-MM-DD)'),
  sexo:                z.enum(SEXO, { error: 'Sexo inválido' }),
  telefono:            z.string().min(8).max(20),
  telefonoEmergencia:  z.string().max(20).optional(),
  contactoEmergencia:  z.string().max(200).optional(),
  direccion:           z.string().optional(),
  correo:              z.string().email().optional().or(z.literal('')),
  seguroMedico:        z.string().max(100).optional(),
  numeroPoliza:        z.string().max(50).optional(),
});

// Todos los campos opcionales para PATCH parcial
const editarPacienteSchema = z.object({
  nombreCompleto:     z.string().min(2).max(200).optional(),
  telefono:           z.string().min(8).max(20).optional(),
  telefonoEmergencia: z.string().max(20).optional().nullable(),
  contactoEmergencia: z.string().max(200).optional().nullable(),
  direccion:          z.string().optional().nullable(),
  correo:             z.string().email().optional().or(z.literal('')).nullable(),
  seguroMedico:       z.string().max(100).optional().nullable(),
  numeroPoliza:       z.string().max(50).optional().nullable(),
});

module.exports = { crearPacienteSchema, editarPacienteSchema };
