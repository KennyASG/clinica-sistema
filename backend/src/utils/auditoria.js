'use strict';

/**
 * Registra un evento de auditoría en la tabla `auditoria`.
 * Se debe llamar dentro de la misma transacción Prisma que la operación auditada.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ usuarioId: string, accion: string, tablaAfectada: string, registroId?: string, datosAnteriores?: object, datosNuevos?: object, ip?: string, userAgent?: string }} params
 */
async function registrarAuditoria(prisma, params) {
  const { usuarioId, accion, tablaAfectada, registroId, datosAnteriores, datosNuevos, ip, userAgent } = params;
  await prisma.auditoria.create({
    data: {
      usuarioId,
      accion,
      tablaAfectada,
      registroId: registroId ?? null,
      datosAnteriores: datosAnteriores ?? undefined,
      datosNuevos: datosNuevos ?? undefined,
      ipAddress: ip ? String(ip).slice(0, 45) : null,
      userAgent: userAgent ?? null,
    },
  });
}

module.exports = registrarAuditoria;
