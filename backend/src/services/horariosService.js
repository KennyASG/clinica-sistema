'use strict';
const prisma = require('../utils/prismaClient');

async function listar(medicoId) {
  return prisma.horarioMedico.findMany({
    where: { ...(medicoId && { medicoId }), activo: true },
    orderBy: [{ medicoId: 'asc' }, { dia: 'asc' }],
    include: { medico: { select: { nombreCompleto: true } } },
  });
}

async function crear({ medicoId, dia, horaInicio, horaFin, duracionCitaMin }) {
  return prisma.horarioMedico.create({
    data: { medicoId, dia, horaInicio, horaFin, duracionCitaMin: duracionCitaMin ?? 30 },
    include: { medico: { select: { nombreCompleto: true } } },
  });
}

async function editar(id, { horaInicio, horaFin, duracionCitaMin, activo }) {
  return prisma.horarioMedico.update({
    where: { id },
    data: {
      ...(horaInicio      !== undefined && { horaInicio }),
      ...(horaFin         !== undefined && { horaFin }),
      ...(duracionCitaMin !== undefined && { duracionCitaMin }),
      ...(activo          !== undefined && { activo }),
    },
  });
}

async function desactivar(id) {
  return prisma.horarioMedico.update({ where: { id }, data: { activo: false } });
}

module.exports = { listar, crear, editar, desactivar };
