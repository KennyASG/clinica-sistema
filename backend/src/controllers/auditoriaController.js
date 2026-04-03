'use strict';
const svc = require('../services/auditoriaService');

// GET /api/auditoria?desde=&hasta=&usuarioId=&accion=&tabla=&page=&limit=
async function listar(req, res, next) {
  try {
    const resultado = await svc.listar(req.query);
    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
