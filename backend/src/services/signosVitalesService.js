'use strict';
const prisma = require('../utils/prismaClient');
const registrarAuditoria = require('../utils/auditoria');

async function crear(datos, { usuarioId, ip, userAgent }) {
  // Verificar que la cita existe
  const cita = await prisma.cita.findUnique({
    where: { id: datos.citaId },
    select: { id: true, estado: true },
  });
  if (!cita) {
    const err = new Error('Cita no encontrada');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Un solo registro por cita (unique en schema)
  const existente = await prisma.signosVitales.findUnique({ where: { citaId: datos.citaId } });
  if (existente) {
    const err = new Error('Esta cita ya tiene signos vitales registrados');
    err.code = 'SIGNOS_DUPLICATE';
    err.status = 409;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const s = await tx.signosVitales.create({
      data: { ...datos, enfermeraId: usuarioId },
    });

    await registrarAuditoria(tx, {
      usuarioId,
      accion: 'INSERT',
      tablaAfectada: 'signos_vitales',
      registroId: s.id,
      datosNuevos: { citaId: datos.citaId },
      ip,
      userAgent,
    });

    return s;
  });
}

module.exports = { crear };
