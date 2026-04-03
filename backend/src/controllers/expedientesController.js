'use strict';
const svc = require('../services/expedientesService');
const errorResponse = require('../utils/errorResponse');
const { editarExpedienteSchema } = require('../validators/expedientes');

// GET /api/expedientes/:id
async function obtener(req, res, next) {
  try {
    const expediente = await svc.obtener(req.params.id);
    return res.json(expediente);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

// PATCH /api/expedientes/:id — RF-12 (RN-03: solo activo=false, nunca DELETE)
async function editar(req, res, next) {
  try {
    const parsed = editarExpedienteSchema.safeParse(req.body);
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

// DELETE /api/expedientes/:id — RN-03: SIEMPRE 405
function metodNoPermitido(_req, res) {
  return res.status(405).json(
    errorResponse('Los expedientes no pueden eliminarse. Use PATCH activo:false', 'METHOD_NOT_ALLOWED')
  );
}

// GET /api/expedientes/:id/historial — RF-14
async function historial(req, res, next) {
  try {
    const consultas = await svc.historial(req.params.id);
    return res.json(consultas);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

// GET /api/expedientes/recientes
async function recientes(_req, res, next) {
  try {
    const expedientes = await svc.recientes();
    return res.json(expedientes);
  } catch (err) {
    next(err);
  }
}

module.exports = { obtener, editar, metodNoPermitido, historial, recientes };
