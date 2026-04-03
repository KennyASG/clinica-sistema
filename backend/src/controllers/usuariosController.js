'use strict';
const svc = require('../services/usuariosService');
const errorResponse = require('../utils/errorResponse');
const { crearUsuarioSchema, editarUsuarioSchema } = require('../validators/usuarios');

// GET /api/usuarios — RF-02
async function listar(_req, res, next) {
  try {
    const usuarios = await svc.listar();
    return res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

// POST /api/usuarios — RF-02
async function crear(req, res, next) {
  try {
    const parsed = crearUsuarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const nuevo = await svc.crear(parsed.data, {
      usuarioId: req.user.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(201).json(nuevo);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

// PATCH /api/usuarios/:id — RF-03
async function editar(req, res, next) {
  try {
    const parsed = editarUsuarioSchema.safeParse(req.body);
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

module.exports = { listar, crear, editar };
