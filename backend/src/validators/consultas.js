'use strict';

const { z } = require('zod');

const crearConsultaSchema = z.object({
  expedienteId:          z.uuid('ID de expediente inválido'),
  citaId:                z.uuid().optional(),
  motivoConsulta:        z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
  diagnosticoCie10:      z.string().max(10).optional(),
  diagnosticoDescripcion:z.string().optional(),
  tratamiento:           z.string().optional(),
  medicamentosRecetados: z.string().optional(),
  indicacionesGenerales: z.string().optional(),
  proximaCitaDias:       z.number().int().positive().optional(),
  esEmergencia:          z.boolean().optional().default(false),
});

module.exports = { crearConsultaSchema };
