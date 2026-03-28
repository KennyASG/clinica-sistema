'use strict';

const { z } = require('zod');

const ESTADOS_VALIDOS = ['pendiente', 'confirmada', 'en_atencion', 'atendida', 'cancelada', 'no_presentada'];

const crearCitaSchema = z.object({
  pacienteId:      z.string().uuid('pacienteId debe ser UUID'),
  medicoId:        z.string().uuid('medicoId debe ser UUID'),
  tipoConsultaId:  z.string().uuid('tipoConsultaId debe ser UUID'),
  fechaHoraInicio: z.string().datetime({ offset: true, message: 'fechaHoraInicio debe ser ISO-8601' }),
  fechaHoraFin:    z.string().datetime({ offset: true, message: 'fechaHoraFin debe ser ISO-8601' }),
  notasSecretaria: z.string().max(500).optional(),
}).refine(
  (d) => new Date(d.fechaHoraFin) > new Date(d.fechaHoraInicio),
  { message: 'fechaHoraFin debe ser posterior a fechaHoraInicio', path: ['fechaHoraFin'] }
);

const cambiarEstadoSchema = z.object({
  estado:           z.enum(ESTADOS_VALIDOS, { message: 'Estado inválido' }),
  motivoCancelacion: z.string().min(5, 'Motivo debe tener al menos 5 caracteres').optional(),
  notasSecretaria:  z.string().max(500).optional(),
}).refine(
  (d) => d.estado !== 'cancelada' || (d.motivoCancelacion && d.motivoCancelacion.trim().length >= 5),
  { message: 'motivoCancelacion es obligatorio al cancelar una cita', path: ['motivoCancelacion'] }
);

const reagendarCitaSchema = z.object({
  fechaHoraInicio: z.string().datetime({ offset: true, message: 'fechaHoraInicio debe ser ISO-8601' }),
  fechaHoraFin:    z.string().datetime({ offset: true, message: 'fechaHoraFin debe ser ISO-8601' }),
  notasSecretaria: z.string().max(500).optional(),
}).refine(
  (d) => new Date(d.fechaHoraFin) > new Date(d.fechaHoraInicio),
  { message: 'fechaHoraFin debe ser posterior a fechaHoraInicio', path: ['fechaHoraFin'] }
);

module.exports = { crearCitaSchema, cambiarEstadoSchema, reagendarCitaSchema };
