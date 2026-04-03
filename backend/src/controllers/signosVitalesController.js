'use strict';
const svc = require('../services/signosVitalesService');
const errorResponse = require('../utils/errorResponse');
const { crearSignosVitalesSchema } = require('../validators/signosVitales');

// POST /api/signos-vitales — RF-11 (enfermera o médico)
async function crear(req, res, next) {
  try {
    const parsed = crearSignosVitalesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const signos = await svc.crear(parsed.data, {
      usuarioId: req.user.id,
      ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json(signos);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

module.exports = { crear };
