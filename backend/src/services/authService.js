'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
const registrarAuditoria = require('../utils/auditoria');
const { enviarResetPassword } = require('../utils/email');

const INTENTOS_MAX = 5;
const BLOQUEO_MS = 15 * 60 * 1000; // 15 minutos

async function login({ email, password }, { esMobile, ip, userAgent }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.activo) {
    const err = new Error('Credenciales incorrectas');
    err.code = 'INVALID_CREDENTIALS';
    err.status = 401;
    throw err;
  }

  if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
    const minutos = Math.ceil((usuario.bloqueadoHasta - Date.now()) / 60000);
    const err = new Error(`Cuenta bloqueada. Intenta de nuevo en ${minutos} minuto(s)`);
    err.code = 'ACCOUNT_LOCKED';
    err.status = 401;
    throw err;
  }

  const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

  if (!passwordValido) {
    const nuevosIntentos = usuario.intentosFallidos + 1;
    const bloquear = nuevosIntentos >= INTENTOS_MAX;
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: nuevosIntentos,
        bloqueadoHasta: bloquear ? new Date(Date.now() + BLOQUEO_MS) : null,
      },
    });
    const err = new Error('Credenciales incorrectas');
    err.code = 'INVALID_CREDENTIALS';
    err.status = 401;
    throw err;
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() },
  });

  const payload = { id: usuario.id, rol: usuario.rol, email: usuario.email };
  if (esMobile) payload.readonly = true;

  const jwtOpts = esMobile ? {} : { expiresIn: process.env.JWT_EXPIRES_IN || '30m' };
  const token = jwt.sign(payload, process.env.JWT_SECRET, jwtOpts);

  await registrarAuditoria(prisma, {
    usuarioId: usuario.id,
    accion: 'LOGIN',
    tablaAfectada: 'usuario',
    registroId: usuario.id,
    ip,
    userAgent,
  });

  return { token, id: usuario.id, rol: usuario.rol, nombre: usuario.nombreCompleto, email: usuario.email };
}

async function logout({ usuarioId, ip, userAgent }) {
  await registrarAuditoria(prisma, {
    usuarioId,
    accion: 'LOGOUT',
    tablaAfectada: 'usuario',
    registroId: usuarioId,
    ip,
    userAgent,
  });
}

function refresh({ id, rol }) {
  const token = jwt.sign(
    { id, rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
  );
  return { token };
}

async function forgotPassword(email) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo) return; // respuesta silenciosa — no revelar si existe

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, proposito: 'reset_password' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const frontendUrl = process.env.FRONTEND_URL || 'https://clinica.kdevsa.online';
  const linkReset = `${frontendUrl}/reset-password?token=${token}`;

  await enviarResetPassword({
    correo: usuario.email,
    nombreUsuario: usuario.nombreCompleto,
    linkReset,
  });
}

async function resetPassword({ token, password }) {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    const err = new Error('El enlace ha expirado o no es válido. Solicita uno nuevo.');
    err.code = 'TOKEN_INVALIDO';
    err.status = 400;
    throw err;
  }

  if (payload.proposito !== 'reset_password') {
    const err = new Error('Token no válido para esta operación');
    err.code = 'TOKEN_INVALIDO';
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.usuario.update({
    where: { id: payload.id },
    data: { passwordHash: hash, intentosFallidos: 0, bloqueadoHasta: null },
  });
}

module.exports = { login, logout, refresh, forgotPassword, resetPassword };
