'use strict';
const prisma = require('../utils/prismaClient');

async function listar() {
  return prisma.tipoConsulta.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, duracionMinutos: true, descripcion: true },
  });
}

async function crear({ nombre, descripcion, duracionMinutos }) {
  return prisma.tipoConsulta.create({
    data: { nombre, descripcion, duracionMinutos: duracionMinutos ?? 30 },
  });
}

async function editar(id, { nombre, descripcion, duracionMinutos, activo }) {
  return prisma.tipoConsulta.update({
    where: { id },
    data: {
      ...(nombre          !== undefined && { nombre }),
      ...(descripcion     !== undefined && { descripcion }),
      ...(duracionMinutos !== undefined && { duracionMinutos }),
      ...(activo          !== undefined && { activo }),
    },
  });
}

async function desactivar(id) {
  return prisma.tipoConsulta.update({ where: { id }, data: { activo: false } });
}

module.exports = { listar, crear, editar, desactivar };
