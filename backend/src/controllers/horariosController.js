'use strict';
const svc = require('../services/horariosService');

// GET /api/horarios?medicoId=
async function listar(req, res, next) {
  try {
    const horarios = await svc.listar(req.query.medicoId);
    return res.json(horarios);
  } catch (err) { next(err); }
}

// POST /api/horarios
async function crear(req, res, next) {
  try {
    const horario = await svc.crear(req.body);
    return res.status(201).json(horario);
  } catch (err) { next(err); }
}

// PATCH /api/horarios/:id
async function editar(req, res, next) {
  try {
    const horario = await svc.editar(req.params.id, req.body);
    return res.json(horario);
  } catch (err) { next(err); }
}

// DELETE /api/horarios/:id  (soft delete)
async function desactivar(req, res, next) {
  try {
    await svc.desactivar(req.params.id);
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listar, crear, editar, desactivar };
