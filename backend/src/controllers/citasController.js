'use strict';
const svc = require('../services/citasService');
const errorResponse = require('../utils/errorResponse');
const { crearCitaSchema, cambiarEstadoSchema, reagendarCitaSchema } = require('../validators/citas');

// POST /api/citas — RF-16 + RF-22
async function crear(req, res, next) {
  try {
    const parsed = crearCitaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const cita = await svc.crear(parsed.data, {
      usuarioId: req.user.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(201).json(cita);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

// GET /api/citas?medico=&fecha= — RF-18
async function listar(req, res, next) {
  try {
    const citas = await svc.listar({ medicoId: req.query.medico, fecha: req.query.fecha });
    return res.json(citas);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

// PATCH /api/citas/:id — RF-19 + RF-20 (RN-05)
async function cambiarEstado(req, res, next) {
  try {
    const parsed = cambiarEstadoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const actualizada = await svc.cambiarEstado(req.params.id, parsed.data, {
      usuarioId: req.user.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.json(actualizada);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

// PATCH /api/citas/:id/reagendar
async function reagendar(req, res, next) {
  try {
    const parsed = reagendarCitaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const actualizada = await svc.reagendar(req.params.id, parsed.data, {
      usuarioId: req.user.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.json(actualizada);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

module.exports = { crear, listar, cambiarEstado, reagendar };
