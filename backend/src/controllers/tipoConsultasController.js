'use strict';
const svc = require('../services/tipoConsultasService');

async function listar(_req, res, next) {
  try {
    const tipos = await svc.listar();
    return res.json(tipos);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const tipo = await svc.crear(req.body);
    return res.status(201).json(tipo);
  } catch (err) { next(err); }
}

async function editar(req, res, next) {
  try {
    const tipo = await svc.editar(req.params.id, req.body);
    return res.json(tipo);
  } catch (err) { next(err); }
}

async function desactivar(req, res, next) {
  try {
    await svc.desactivar(req.params.id);
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listar, crear, editar, desactivar };
