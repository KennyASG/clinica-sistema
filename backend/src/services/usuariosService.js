'use strict';
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prismaClient');
const registrarAuditoria = require('../utils/auditoria');

const SALT_ROUNDS = 12;

const ESPECIALIDADES_SELECT = {
  especialidades: {
    select: {
      esPrincipal: true,
      especialidad: { select: { id: true, nombre: true } },
    },
  },
};

// GET /api/usuarios — RF-02
async function listar() {
  return prisma.usuario.findMany({
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
      ...ESPECIALIDADES_SELECT,
    },
    orderBy: { nombreCompleto: 'asc' },
  });
}

// POST /api/usuarios — RF-02
async function crear({ password, especialidadIds = [], ...datos }, { usuarioId, ip, userAgent }) {
  const existe = await prisma.usuario.findUnique({ where: { email: datos.email } });
  if (existe) {
    const err = new Error('Ya existe un usuario con ese email');
    err.code = 'EMAIL_DUPLICATE';
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return prisma.$transaction(async (tx) => {
    const u = await tx.usuario.create({
      data: {
        ...datos,
        passwordHash,
        creadoPorId: usuarioId,
        ...(datos.rol === 'medico' && especialidadIds.length > 0 ? {
          especialidades: {
            create: especialidadIds.map((id, idx) => ({
              especialidadId: id,
              esPrincipal: idx === 0,
            })),
          },
        } : {}),
      },
      select: {
        id: true, nombreCompleto: true, email: true, rol: true, activo: true, creadoEn: true,
        ...ESPECIALIDADES_SELECT,
      },
    });
    await registrarAuditoria(tx, {
      usuarioId,
      accion: 'INSERT',
      tablaAfectada: 'usuario',
      registroId: u.id,
      datosNuevos: { email: u.email, rol: u.rol },
      ip,
      userAgent,
    });
    return u;
  });
}

// PATCH /api/usuarios/:id — RF-03
async function editar(id, { password, especialidadIds, ...datos }, { usuarioId, ip, userAgent }) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (password) datos.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return prisma.$transaction(async (tx) => {
    const u = await tx.usuario.update({
      where: { id },
      data: datos,
      select: { id: true, nombreCompleto: true, email: true, rol: true, activo: true },
    });

    if (Array.isArray(especialidadIds) && u.rol === 'medico') {
      await tx.medicoEspecialidad.deleteMany({ where: { medicoId: u.id } });
      if (especialidadIds.length > 0) {
        await tx.medicoEspecialidad.createMany({
          data: especialidadIds.map((eid, idx) => ({
            medicoId: u.id,
            especialidadId: eid,
            esPrincipal: idx === 0,
          })),
        });
      }
    }

    await registrarAuditoria(tx, {
      usuarioId,
      accion: 'UPDATE',
      tablaAfectada: 'usuario',
      registroId: u.id,
      datosAnteriores: { email: usuario.email, rol: usuario.rol, activo: usuario.activo },
      datosNuevos: { email: u.email, rol: u.rol, activo: u.activo },
      ip,
      userAgent,
    });

    return tx.usuario.findUnique({
      where: { id: u.id },
      select: { id: true, nombreCompleto: true, email: true, rol: true, activo: true, ...ESPECIALIDADES_SELECT },
    });
  });
}

module.exports = { listar, crear, editar };
