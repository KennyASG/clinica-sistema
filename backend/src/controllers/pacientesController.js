'use strict';
const svc = require('../services/pacientesService');
const errorResponse = require('../utils/errorResponse');
const { crearPacienteSchema, editarPacienteSchema } = require('../validators/pacientes');

// GET /api/pacientes?q= — RF-09
async function buscar(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const pacientes = await svc.buscar(q);
    return res.json(pacientes);
  } catch (err) {
    next(err);
  }
}

// POST /api/pacientes — RF-07 + RF-08
async function crear(req, res, next) {
  try {
    const parsed = crearPacienteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const resultado = await svc.crear(parsed.data, {
      usuarioId: req.user.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(201).json(resultado);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

// GET /api/pacientes/:id
async function obtener(req, res, next) {
  try {
    const paciente = await svc.obtener(req.params.id);
    return res.json(paciente);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

// PATCH /api/pacientes/:id
async function editar(req, res, next) {
  try {
    const parsed = editarPacienteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const actualizado = await svc.editar(req.params.id, parsed.data, {
      usuarioId: req.user.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.json(actualizado);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

module.exports = { buscar, crear, obtener, editar };
