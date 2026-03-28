'use strict';

const prisma = require('../utils/prismaClient');

async function listar(_req, res, next) {
  try {
    const tipos = await prisma.tipoConsulta.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, duracionMinutos: true, descripcion: true },
    });
    return res.json(tipos);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
