'use strict';
const svc = require('../services/consultasService');
const errorResponse = require('../utils/errorResponse');
const { crearConsultaSchema } = require('../validators/consultas');

// POST /api/consultas — RF-10 (RN-02: solo médico)
async function crear(req, res, next) {
  try {
    const parsed = crearConsultaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const consulta = await svc.crear(parsed.data, {
      medicoId: req.user.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(201).json(consulta);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

module.exports = { crear };
