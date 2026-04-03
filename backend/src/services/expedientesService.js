'use strict';
const prisma = require('../utils/prismaClient');
const registrarAuditoria = require('../utils/auditoria');

// GET /api/expedientes/:id
async function obtener(id) {
  const expediente = await prisma.expediente.findUnique({
    where: { id },
    include: {
      paciente: {
        select: {
          id: true, nombreCompleto: true, dpi: true,
          fechaNacimiento: true, sexo: true, telefono: true,
          telefonoEmergencia: true, contactoEmergencia: true,
          correo: true, activo: true,
        },
      },
    },
  });

  if (!expediente) {
    const err = new Error('Expediente no encontrado');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return expediente;
}

// PATCH /api/expedientes/:id — RF-12 (RN-03: solo activo=false, nunca DELETE)
async function editar(id, datos, { usuarioId, ip, userAgent }) {
  const expediente = await prisma.expediente.findUnique({ where: { id } });
  if (!expediente) {
    const err = new Error('Expediente no encontrado');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Sincroniza flag tiene_alergias cuando se actualiza el campo alergias (RF-15)
  if ('alergias' in datos) {
    datos.tieneAlergias = !!(datos.alergias && datos.alergias.trim().length > 0);
  }

  datos.actualizadoPorId = usuarioId;

  return prisma.$transaction(async (tx) => {
    const e = await tx.expediente.update({ where: { id }, data: datos });

    await registrarAuditoria(tx, {
      usuarioId,
      accion: 'UPDATE',
      tablaAfectada: 'expediente',
      registroId: e.id,
      datosAnteriores: { tieneAlergias: expediente.tieneAlergias, activo: expediente.activo },
      datosNuevos: { tieneAlergias: e.tieneAlergias, activo: e.activo },
      ip,
      userAgent,
    });

    return e;
  });
}

// GET /api/expedientes/:id/historial — RF-14
async function historial(id) {
  const expediente = await prisma.expediente.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!expediente) {
    const err = new Error('Expediente no encontrado');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return prisma.consulta.findMany({
    where: { expedienteId: id },
    include: {
      medico: { select: { id: true, nombreCompleto: true, rol: true } },
      cita: {
        include: {
          tipoConsulta: { select: { nombre: true } },
          signosVitales: {
            select: {
              presionArterial: true, temperaturaC: true, pesoKg: true,
              tallaCm: true, frecuenciaCardiaca: true, saturacionO2: true,
              glucosaMgdl: true, observaciones: true,
            },
          },
        },
      },
    },
    orderBy: { fechaHora: 'desc' },
  });
}

// GET /api/expedientes/recientes
async function recientes() {
  return prisma.expediente.findMany({
    where: { activo: true },
    orderBy: { actualizadoEn: 'desc' },
    take: 8,
    select: {
      id: true,
      tieneAlergias: true,
      actualizadoEn: true,
      paciente: {
        select: { id: true, nombreCompleto: true, sexo: true, fechaNacimiento: true },
      },
    },
  });
}

module.exports = { obtener, editar, historial, recientes };
