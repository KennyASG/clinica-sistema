'use strict';
const prisma = require('../utils/prismaClient');
const registrarAuditoria = require('../utils/auditoria');
const { enviarConfirmacionCita } = require('../utils/email');

const TERMINALES = ['atendida', 'cancelada', 'no_presentada'];

// POST /api/citas — RF-16 + RF-22
async function crear(datos, { usuarioId, ip, userAgent }) {
  const { pacienteId, medicoId, tipoConsultaId, fechaHoraInicio, fechaHoraFin, notasSecretaria } = datos;
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
    const err = new Error('El médico ya tiene una cita en ese horario');
    err.code = 'HORARIO_OCUPADO';
    err.status = 409;
    throw err;
  }

  const [paciente, medico] = await Promise.all([
    prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true, nombreCompleto: true, correo: true } }),
    prisma.usuario.findUnique({ where: { id: medicoId },   select: { id: true, nombreCompleto: true, rol: true } }),
  ]);

  if (!paciente) {
    const err = new Error('Paciente no encontrado'); err.code = 'NOT_FOUND'; err.status = 404; throw err;
  }
  if (!medico || medico.rol !== 'medico') {
    const err = new Error('Médico no encontrado'); err.code = 'NOT_FOUND'; err.status = 404; throw err;
  }

  const tipoConsulta = await prisma.tipoConsulta.findUnique({ where: { id: tipoConsultaId }, select: { id: true, nombre: true } });
  if (!tipoConsulta) {
    const err = new Error('Tipo de consulta no encontrado'); err.code = 'NOT_FOUND'; err.status = 404; throw err;
  }

  const cita = await prisma.$transaction(async (tx) => {
    const c = await tx.cita.create({
      data: {
        pacienteId, medicoId, tipoConsultaId,
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
        notasSecretaria: notasSecretaria || null,
        creadoPorId: usuarioId,
      },
      include: {
        paciente:     { select: { nombreCompleto: true, correo: true } },
        medico:       { select: { nombreCompleto: true } },
        tipoConsulta: { select: { nombre: true } },
      },
    });

    await registrarAuditoria(tx, {
      usuarioId,
      accion: 'INSERT',
      tablaAfectada: 'cita',
      registroId: c.id,
      datosNuevos: { pacienteId, medicoId, fechaHoraInicio, fechaHoraFin },
      ip,
      userAgent,
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
      tipo: tipoConsulta.nombre,
    }).catch(() => {});
  }

  return cita;
}

// GET /api/citas?medico=&fecha= — RF-18
async function listar({ medicoId, fecha }) {
  const where = {};

  if (medicoId) where.medicoId = medicoId;

  if (fecha) {
    const dia = new Date(fecha);
    if (isNaN(dia.getTime())) {
      const err = new Error('Fecha inválida'); err.code = 'VALIDATION_ERROR'; err.status = 422; throw err;
    }
    const siguiente = new Date(dia);
    siguiente.setDate(siguiente.getDate() + 1);
    where.fechaHoraInicio = { gte: dia, lt: siguiente };
  }

  return prisma.cita.findMany({
    where,
    orderBy: { fechaHoraInicio: 'asc' },
    include: {
      paciente: { select: { id: true, nombreCompleto: true, dpi: true, telefono: true } },
      medico: {
        select: {
          id: true,
          nombreCompleto: true,
          especialidades: {
            where: { esPrincipal: true },
            select: { especialidad: { select: { nombre: true } } },
            take: 1,
          },
        },
      },
      tipoConsulta:  { select: { id: true, nombre: true } },
      signosVitales: true,
    },
  });
}

// PATCH /api/citas/:id — RF-19 + RF-20 (RN-05)
async function cambiarEstado(id, { estado, motivoCancelacion, notasSecretaria }, { usuarioId, ip, userAgent }) {
  const cita = await prisma.cita.findUnique({
    where: { id },
    include: { consulta: { select: { id: true } } },
  });
  if (!cita) {
    const err = new Error('Cita no encontrada'); err.code = 'NOT_FOUND'; err.status = 404; throw err;
  }

  if (TERMINALES.includes(cita.estado)) {
    const err = new Error(`La cita ya está en estado "${cita.estado}" y no puede modificarse`);
    err.code = 'ESTADO_FINAL'; err.status = 409; throw err;
  }

  if (cita.consulta && ['cancelada', 'no_presentada'].includes(estado)) {
    const err = new Error('No se puede cancelar una cita que ya tiene una nota de consulta registrada');
    err.code = 'CONSULTA_EXISTENTE'; err.status = 409; throw err;
  }

  return prisma.$transaction(async (tx) => {
    const c = await tx.cita.update({
      where: { id },
      data: {
        estado,
        ...(estado === 'cancelada' && {
          motivoCancelacion,
          canceladoPorId: usuarioId,
          canceladoEn: new Date(),
        }),
        ...(notasSecretaria !== undefined && { notasSecretaria }),
      },
      include: {
        paciente:     { select: { nombreCompleto: true } },
        medico:       { select: { nombreCompleto: true } },
        tipoConsulta: { select: { nombre: true } },
      },
    });

    await registrarAuditoria(tx, {
      usuarioId,
      accion: 'UPDATE',
      tablaAfectada: 'cita',
      registroId: id,
      datosAnteriores: { estado: cita.estado },
      datosNuevos: { estado, motivoCancelacion },
      ip,
      userAgent,
    });

    return c;
  });
}

// PATCH /api/citas/:id/reagendar
async function reagendar(id, { fechaHoraInicio, fechaHoraFin, notasSecretaria }, { usuarioId, ip, userAgent }) {
  const inicio = new Date(fechaHoraInicio);
  const fin    = new Date(fechaHoraFin);

  const cita = await prisma.cita.findUnique({ where: { id } });
  if (!cita) {
    const err = new Error('Cita no encontrada'); err.code = 'NOT_FOUND'; err.status = 404; throw err;
  }

  if (TERMINALES.includes(cita.estado)) {
    const err = new Error('No se puede reagendar una cita en estado final');
    err.code = 'ESTADO_FINAL'; err.status = 409; throw err;
  }

  const conflicto = await prisma.cita.findFirst({
    where: {
      medicoId: cita.medicoId,
      id:       { not: id },
      estado:   { notIn: ['cancelada', 'no_presentada'] },
      AND: [
        { fechaHoraInicio: { lt: fin } },
        { fechaHoraFin:    { gt: inicio } },
      ],
    },
  });
  if (conflicto) {
    const err = new Error('El médico ya tiene una cita en ese horario');
    err.code = 'HORARIO_OCUPADO'; err.status = 409; throw err;
  }

  return prisma.$transaction(async (tx) => {
    const c = await tx.cita.update({
      where: { id },
      data: {
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
        estado: 'pendiente',
        ...(notasSecretaria !== undefined && { notasSecretaria }),
      },
      include: {
        paciente:     { select: { nombreCompleto: true } },
        medico:       { select: { nombreCompleto: true } },
        tipoConsulta: { select: { nombre: true } },
      },
    });

    await registrarAuditoria(tx, {
      usuarioId,
      accion: 'UPDATE',
      tablaAfectada: 'cita',
      registroId: id,
      datosAnteriores: { fechaHoraInicio: cita.fechaHoraInicio, fechaHoraFin: cita.fechaHoraFin },
      datosNuevos: { fechaHoraInicio, fechaHoraFin },
      ip,
      userAgent,
    });

    return c;
  });
}

module.exports = { crear, listar, cambiarEstado, reagendar };
