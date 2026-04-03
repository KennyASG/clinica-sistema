'use strict';
const prisma = require('../utils/prismaClient');

async function listar({ usuarioId, accion, tabla, page, limit, desde, hasta }) {
  const hoy = new Date();
  const fechaDesde = desde ? new Date(desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fechaHasta = hasta ? new Date(hasta + 'T23:59:59') : hoy;

  const pageNum  = Math.max(1, parseInt(page)  || 1);
  const limitNum = Math.min(100, parseInt(limit) || 50);
  const skip     = (pageNum - 1) * limitNum;

  const where = {
    fechaHora: { gte: fechaDesde, lte: fechaHasta },
    ...(usuarioId && { usuarioId }),
    ...(accion    && { accion }),
    ...(tabla     && { tablaAfectada: tabla }),
  };

  const [total, registros] = await prisma.$transaction([
    prisma.auditoria.count({ where }),
    prisma.auditoria.findMany({
      where,
      orderBy: { fechaHora: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true,
        accion: true,
        tablaAfectada: true,
        registroId: true,
        datosAnteriores: true,
        datosNuevos: true,
        ipAddress: true,
        fechaHora: true,
        usuario: { select: { nombreCompleto: true, rol: true } },
      },
    }),
  ]);

  return { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum), registros };
}

module.exports = { listar };
