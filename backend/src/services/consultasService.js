'use strict';
const prisma = require('../utils/prismaClient');
const registrarAuditoria = require('../utils/auditoria');

// POST /api/consultas — RF-10 (RN-02: solo médico)
async function crear(datos, { medicoId, ip, userAgent }) {
  // Verificar que el expediente existe y está activo (RN-03)
  const expediente = await prisma.expediente.findUnique({
    where: { id: datos.expedienteId },
    select: { id: true, activo: true, pacienteId: true },
  });
  if (!expediente) {
    const err = new Error('Expediente no encontrado');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }
  if (!expediente.activo) {
    const err = new Error('El expediente está inactivo');
    err.code = 'EXPEDIENTE_INACTIVO';
    err.status = 409;
    throw err;
  }

  // Si viene citaId: verificar que la cita pertenece al mismo paciente y no tiene consulta ya
  if (datos.citaId) {
    const cita = await prisma.cita.findUnique({
      where: { id: datos.citaId },
      select: { pacienteId: true, consulta: { select: { id: true } } },
    });
    if (!cita) {
      const err = new Error('Cita no encontrada');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    if (cita.pacienteId !== expediente.pacienteId) {
      const err = new Error('La cita no corresponde a este paciente');
      err.code = 'CITA_PACIENTE_MISMATCH';
      err.status = 409;
      throw err;
    }
    if (cita.consulta) {
      const err = new Error('Esta cita ya tiene una nota de consulta registrada');
      err.code = 'CONSULTA_DUPLICADA';
      err.status = 409;
      throw err;
    }
  }

  return prisma.$transaction(async (tx) => {
    const c = await tx.consulta.create({
      data: {
        ...datos,
        medicoId, // RN-02: el médico autenticado es el tratante
      },
      include: {
        medico: { select: { id: true, nombreCompleto: true } },
      },
    });

    // Si la consulta viene de una cita, marcarla automáticamente como atendida
    if (datos.citaId) {
      await tx.cita.update({ where: { id: datos.citaId }, data: { estado: 'atendida' } });
    }

    await registrarAuditoria(tx, {
      usuarioId: medicoId,
      accion: 'INSERT',
      tablaAfectada: 'consulta',
      registroId: c.id,
      datosNuevos: {
        expedienteId: c.expedienteId,
        motivoConsulta: c.motivoConsulta,
        diagnosticoCie10: c.diagnosticoCie10,
      },
      ip,
      userAgent,
    });

    return c;
  });
}

module.exports = { crear };
