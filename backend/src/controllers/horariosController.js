'use strict';
const prisma = require('../utils/prismaClient');

// GET /api/horarios?medicoId=
async function listar(req, res, next) {
  try {
    const { medicoId } = req.query;
    const horarios = await prisma.horarioMedico.findMany({
      where: { ...(medicoId && { medicoId }), activo: true },
      orderBy: [{ medicoId: 'asc' }, { dia: 'asc' }],
      include: { medico: { select: { nombreCompleto: true } } },
    });
    return res.json(horarios);
  } catch (err) { next(err); }
}

// POST /api/horarios
async function crear(req, res, next) {
  try {
    const { medicoId, dia, horaInicio, horaFin, duracionCitaMin } = req.body;
    const horario = await prisma.horarioMedico.create({
      data: { medicoId, dia, horaInicio, horaFin, duracionCitaMin: duracionCitaMin ?? 30 },
      include: { medico: { select: { nombreCompleto: true } } },
    });
    return res.status(201).json(horario);
  } catch (err) { next(err); }
}

// PATCH /api/horarios/:id
async function editar(req, res, next) {
  try {
    const { horaInicio, horaFin, duracionCitaMin, activo } = req.body;
    const horario = await prisma.horarioMedico.update({
      where: { id: req.params.id },
      data: {
        ...(horaInicio      !== undefined && { horaInicio }),
        ...(horaFin         !== undefined && { horaFin }),
        ...(duracionCitaMin !== undefined && { duracionCitaMin }),
        ...(activo          !== undefined && { activo }),
      },
    });
    return res.json(horario);
  } catch (err) { next(err); }
}

// DELETE /api/horarios/:id  (soft delete)
async function desactivar(req, res, next) {
  try {
    await prisma.horarioMedico.update({ where: { id: req.params.id }, data: { activo: false } });
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listar, crear, editar, desactivar };
