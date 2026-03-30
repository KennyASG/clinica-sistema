'use strict';

const { z } = require('zod');

const crearSignosVitalesSchema = z.object({
  citaId:            z.string().uuid('ID de cita inválido'),
  presionArterial:   z.string().max(10).optional(),
  temperaturaC:      z.number().min(30).max(45).optional(),
  pesoKg:            z.number().positive().optional(),
  tallaCm:           z.number().positive().optional(),
  frecuenciaCardiaca:z.number().int().min(20).max(300).optional(),
  saturacionO2:      z.number().int().min(0).max(100).optional(),
  glucosaMgdl:       z.number().int().positive().optional(),
  observaciones:     z.string().optional(),
});

module.exports = { crearSignosVitalesSchema };
