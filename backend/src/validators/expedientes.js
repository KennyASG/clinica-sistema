'use strict';

const { z } = require('zod');

const TIPO_SANGRE = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG', 'desconocido'];

const editarExpedienteSchema = z.object({
  tipoSangre:              z.enum(TIPO_SANGRE).optional(),
  alergias:                z.string().optional().nullable(),
  enfermedadesCronicas:    z.string().optional().nullable(),
  medicamentosPermanentes: z.string().optional().nullable(),
  antecedentesFamiliares:  z.string().optional().nullable(),
  antecedentesQuirurgicos: z.string().optional().nullable(),
  antecedentesTraumaticos: z.string().optional().nullable(),
  observacionesGenerales:  z.string().optional().nullable(),
  activo:                  z.boolean().optional(),
});

module.exports = { editarExpedienteSchema };
