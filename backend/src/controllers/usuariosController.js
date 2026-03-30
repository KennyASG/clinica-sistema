'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../utils/prismaClient');
const errorResponse = require('../utils/errorResponse');
const registrarAuditoria = require('../utils/auditoria');
const { crearUsuarioSchema, editarUsuarioSchema } = require('../validators/usuarios');

const SALT_ROUNDS = 12;

// GET /api/usuarios — RF-02
async function listar(req, res, next) {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        rol: true,
        numeroColegiado: true,
        telefono: true,
        activo: true,
        creadoEn: true,
        ultimoAcceso: true,
      },
      orderBy: { nombreCompleto: 'asc' },
    });
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
    const { password, ...datos } = parsed.data;

    const existe = await prisma.usuario.findUnique({ where: { email: datos.email } });
    if (existe) {
      return res.status(409).json(errorResponse('Ya existe un usuario con ese email', 'EMAIL_DUPLICATE'));
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const nuevo = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({
        data: { ...datos, passwordHash, creadoPorId: req.user.id },
        select: { id: true, nombreCompleto: true, email: true, rol: true, activo: true, creadoEn: true },
      });
      await registrarAuditoria(tx, {
        usuarioId: req.user.id,
        accion: 'INSERT',
        tablaAfectada: 'usuario',
        registroId: u.id,
        datosNuevos: { email: u.email, rol: u.rol },
        ip,
        userAgent: req.headers['user-agent'],
      });
      return u;
    });

    return res.status(201).json(nuevo);
  } catch (err) {
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

    const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!usuario) {
      return res.status(404).json(errorResponse('Usuario no encontrado', 'NOT_FOUND'));
    }

    const { password, ...datos } = parsed.data;
    if (password) datos.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const actualizado = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.update({
        where: { id: req.params.id },
        data: datos,
        select: { id: true, nombreCompleto: true, email: true, rol: true, activo: true },
      });
      await registrarAuditoria(tx, {
        usuarioId: req.user.id,
        accion: 'UPDATE',
        tablaAfectada: 'usuario',
        registroId: u.id,
        datosAnteriores: { email: usuario.email, rol: usuario.rol, activo: usuario.activo },
        datosNuevos: { email: u.email, rol: u.rol, activo: u.activo },
        ip,
        userAgent: req.headers['user-agent'],
      });
      return u;
    });

    return res.json(actualizado);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, crear, editar };
