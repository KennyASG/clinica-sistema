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
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const { nombre, descripcion, duracionMinutos } = req.body;
    const tipo = await prisma.tipoConsulta.create({
      data: { nombre, descripcion, duracionMinutos: duracionMinutos ?? 30 },
    });
    return res.status(201).json(tipo);
  } catch (err) { next(err); }
}

async function editar(req, res, next) {
  try {
    const { nombre, descripcion, duracionMinutos, activo } = req.body;
    const tipo = await prisma.tipoConsulta.update({
      where: { id: req.params.id },
      data: {
        ...(nombre          !== undefined && { nombre }),
        ...(descripcion     !== undefined && { descripcion }),
        ...(duracionMinutos !== undefined && { duracionMinutos }),
        ...(activo          !== undefined && { activo }),
      },
    });
    return res.json(tipo);
  } catch (err) { next(err); }
}

async function desactivar(req, res, next) {
  try {
    await prisma.tipoConsulta.update({ where: { id: req.params.id }, data: { activo: false } });
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listar, crear, editar, desactivar };
