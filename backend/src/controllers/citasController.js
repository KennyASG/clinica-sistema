'use strict';

const prisma = require('../utils/prismaClient');
const errorResponse = require('../utils/errorResponse');
const registrarAuditoria = require('../utils/auditoria');
const { enviarConfirmacionCita } = require('../utils/email');
const { crearCitaSchema, cambiarEstadoSchema } = require('../validators/citas');

// POST /api/citas — RF-16 + RF-22
async function crear(req, res, next) {
  try {
    const parsed = crearCitaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const { pacienteId, medicoId, tipoConsultaId, fechaHoraInicio, fechaHoraFin, notasSecretaria } = parsed.data;

    const inicio = new Date(fechaHoraInicio);
    const fin    = new Date(fechaHoraFin);

    // RF-16 / RN-01 — verificar conflicto de horario
    const conflicto = await prisma.cita.findFirst({
      where: {
        medicoId,
        estado: { notIn: ['cancelada', 'no_presentada'] },
        AND: [
          { fechaHoraInicio: { lt: fin } },
          { fechaHoraFin:    { gt: inicio } },
        ],
      },
    });
    if (conflicto) {
      return res.status(409).json(errorResponse(
        'El médico ya tiene una cita en ese horario',
        'HORARIO_OCUPADO'
      ));
    }

    // Verificar que paciente y médico existan
    const [paciente, medico] = await Promise.all([
      prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true, nombreCompleto: true, correo: true } }),
      prisma.usuario.findUnique({ where: { id: medicoId },   select: { id: true, nombreCompleto: true, rol: true } }),
    ]);

    if (!paciente) return res.status(404).json(errorResponse('Paciente no encontrado', 'NOT_FOUND'));
    if (!medico || medico.rol !== 'medico') return res.status(404).json(errorResponse('Médico no encontrado', 'NOT_FOUND'));

    const tipoConsulta = await prisma.tipoConsulta.findUnique({ where: { id: tipoConsultaId }, select: { id: true, nombre: true } });
    if (!tipoConsulta) return res.status(404).json(errorResponse('Tipo de consulta no encontrado', 'NOT_FOUND'));

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const cita = await prisma.$transaction(async (tx) => {
      const c = await tx.cita.create({
        data: {
          pacienteId,
          medicoId,
          tipoConsultaId,
          fechaHoraInicio: inicio,
          fechaHoraFin: fin,
          notasSecretaria: notasSecretaria || null,
          creadoPorId: req.user.id,
        },
        include: {
          paciente: { select: { nombreCompleto: true, correo: true } },
          medico:   { select: { nombreCompleto: true } },
          tipoConsulta: { select: { nombre: true } },
        },
      });

      await registrarAuditoria(tx, {
        usuarioId: req.user.id,
        accion: 'INSERT',
        tablaAfectada: 'cita',
        registroId: c.id,
        datosNuevos: { pacienteId, medicoId, fechaHoraInicio, fechaHoraFin },
        ip,
        userAgent: req.headers['user-agent'],
      });

      return c;
    });

    // RF-22 — email de confirmación (no crítico)
    if (paciente.correo) {
      enviarConfirmacionCita({
        correo: paciente.correo,
        nombrePaciente: paciente.nombreCompleto,
        medico: medico.nombreCompleto,
        fecha: inicio,
        tipo: tipoConsulta?.nombre,
      }).catch(() => {});
    }

    return res.status(201).json(cita);
  } catch (err) {
    next(err);
  }
}

// GET /api/citas?medico=&fecha= — RF-18
async function listar(req, res, next) {
  try {
    const { medico: medicoId, fecha } = req.query;

    const where = {};

    if (medicoId) where.medicoId = medicoId;

    if (fecha) {
      const dia = new Date(fecha);
      if (isNaN(dia.getTime())) {
        return res.status(422).json(errorResponse('Fecha inválida', 'VALIDATION_ERROR'));
      }
      const siguiente = new Date(dia);
      siguiente.setDate(siguiente.getDate() + 1);
      where.fechaHoraInicio = { gte: dia, lt: siguiente };
    }

    const citas = await prisma.cita.findMany({
      where,
      orderBy: { fechaHoraInicio: 'asc' },
      include: {
        paciente:    { select: { id: true, nombreCompleto: true, dpi: true, telefono: true } },
        medico:      { select: { id: true, nombreCompleto: true } },
        tipoConsulta:{ select: { id: true, nombre: true } },
      },
    });

    return res.json(citas);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/citas/:id — RF-19 + RF-20 (RN-05)
async function cambiarEstado(req, res, next) {
  try {
    const { id } = req.params;

    const parsed = cambiarEstadoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const { estado, motivoCancelacion, notasSecretaria } = parsed.data;

    const cita = await prisma.cita.findUnique({ where: { id } });
    if (!cita) return res.status(404).json(errorResponse('Cita no encontrada', 'NOT_FOUND'));

    const TERMINALES = ['atendida', 'cancelada', 'no_presentada'];
    if (TERMINALES.includes(cita.estado)) {
      return res.status(409).json(errorResponse(
        `La cita ya está en estado "${cita.estado}" y no puede modificarse`,
        'ESTADO_FINAL'
      ));
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const actualizada = await prisma.$transaction(async (tx) => {
      const c = await tx.cita.update({
        where: { id },
        data: {
          estado,
          ...(estado === 'cancelada' && {
            motivoCancelacion,
            canceladoPorId: req.user.id,
            canceladoEn: new Date(),
          }),
          ...(notasSecretaria !== undefined && { notasSecretaria }),
        },
        include: {
          paciente:    { select: { nombreCompleto: true } },
          medico:      { select: { nombreCompleto: true } },
          tipoConsulta:{ select: { nombre: true } },
        },
      });

      await registrarAuditoria(tx, {
        usuarioId: req.user.id,
        accion: 'UPDATE',
        tablaAfectada: 'cita',
        registroId: id,
        datosAnteriores: { estado: cita.estado },
        datosNuevos: { estado, motivoCancelacion },
        ip,
        userAgent: req.headers['user-agent'],
      });

      return c;
    });

    return res.json(actualizada);
  } catch (err) {
    next(err);
  }
}

module.exports = { crear, listar, cambiarEstado };
