'use strict';

const prisma = require('../utils/prismaClient');
const errorResponse = require('../utils/errorResponse');
const registrarAuditoria = require('../utils/auditoria');
const { crearConsultaSchema } = require('../validators/consultas');

// POST /api/consultas — RF-10 (RN-02: solo médico)
async function crear(req, res, next) {
  try {
    const parsed = crearConsultaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const datos = parsed.data;

    // Verificar que el expediente existe y está activo (RN-03)
    const expediente = await prisma.expediente.findUnique({
      where: { id: datos.expedienteId },
      select: { id: true, activo: true, pacienteId: true },
    });
    if (!expediente) {
      return res.status(404).json(errorResponse('Expediente no encontrado', 'NOT_FOUND'));
    }
    if (!expediente.activo) {
      return res.status(409).json(errorResponse('El expediente está inactivo', 'EXPEDIENTE_INACTIVO'));
    }

    // Si viene citaId: verificar que la cita pertenece al mismo paciente y no tiene consulta ya
    if (datos.citaId) {
      const cita = await prisma.cita.findUnique({
        where: { id: datos.citaId },
        select: { pacienteId: true, consulta: { select: { id: true } } },
      });
      if (!cita) {
        return res.status(404).json(errorResponse('Cita no encontrada', 'NOT_FOUND'));
      }
      if (cita.pacienteId !== expediente.pacienteId) {
        return res.status(409).json(errorResponse('La cita no corresponde a este paciente', 'CITA_PACIENTE_MISMATCH'));
      }
      if (cita.consulta) {
        return res.status(409).json(errorResponse('Esta cita ya tiene una nota de consulta registrada', 'CONSULTA_DUPLICADA'));
      }
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const consulta = await prisma.$transaction(async (tx) => {
      const c = await tx.consulta.create({
        data: {
          ...datos,
          medicoId: req.user.id, // RN-02: el médico autenticado es el tratante
        },
        include: {
          medico: { select: { id: true, nombreCompleto: true } },
        },
      });

      await registrarAuditoria(tx, {
        usuarioId: req.user.id,
        accion: 'INSERT',
        tablaAfectada: 'consulta',
        registroId: c.id,
        datosNuevos: {
          expedienteId: c.expedienteId,
          motivoConsulta: c.motivoConsulta,
          diagnosticoCie10: c.diagnosticoCie10,
        },
        ip,
        userAgent: req.headers['user-agent'],
      });

      return c;
    });

    return res.status(201).json(consulta);
  } catch (err) {
    next(err);
  }
}

module.exports = { crear };
