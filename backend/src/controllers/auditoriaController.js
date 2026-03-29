'use strict';
const prisma = require('../utils/prismaClient');

// GET /api/auditoria?desde=&hasta=&usuarioId=&accion=&tabla=&page=&limit=
async function listar(req, res, next) {
  try {
    const { usuarioId, accion, tabla } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const hoy   = new Date();
    const desde = req.query.desde ? new Date(req.query.desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const hasta = req.query.hasta ? new Date(req.query.hasta + 'T23:59:59') : hoy;

    const where = {
      fechaHora: { gte: desde, lte: hasta },
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
        take: limit,
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

    return res.json({ total, page, limit, pages: Math.ceil(total / limit), registros });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
