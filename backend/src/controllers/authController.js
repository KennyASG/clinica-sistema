'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
const errorResponse = require('../utils/errorResponse');
const registrarAuditoria = require('../utils/auditoria');
const { loginSchema } = require('../validators/auth');

const INTENTOS_MAX = 5;
const BLOQUEO_MS = 15 * 60 * 1000; // 15 minutos

async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const { email, password } = parsed.data;

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // Respuesta genérica para no revelar si el email existe
    if (!usuario || !usuario.activo) {
      return res.status(401).json(errorResponse('Credenciales incorrectas', 'INVALID_CREDENTIALS'));
    }

    // Cuenta bloqueada temporalmente
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutos = Math.ceil((usuario.bloqueadoHasta - Date.now()) / 60000);
      return res.status(401).json(
        errorResponse(`Cuenta bloqueada. Intenta de nuevo en ${minutos} minuto(s)`, 'ACCOUNT_LOCKED')
      );
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
      return res.status(401).json(errorResponse('Credenciales incorrectas', 'INVALID_CREDENTIALS'));
    }

    // Login correcto: resetea intentos y actualiza último acceso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() },
    });

    // JWT: sin expiración para app móvil, 30 min para web
    const esMobile = req.headers['x-app-source'] === 'mobile';
    const payload = { id: usuario.id, rol: usuario.rol, email: usuario.email };
    if (esMobile) payload.readonly = true;

    const jwtOpts = esMobile ? {} : { expiresIn: process.env.JWT_EXPIRES_IN || '30m' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, jwtOpts);

    // Auditoría de login (RN-06)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await registrarAuditoria(prisma, {
      usuarioId: usuario.id,
      accion: 'LOGIN',
      tablaAfectada: 'usuario',
      registroId: usuario.id,
      ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      token,
      id: usuario.id,
      rol: usuario.rol,
      nombre: usuario.nombreCompleto,
      email: usuario.email,
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await registrarAuditoria(prisma, {
      usuarioId: req.user.id,
      accion: 'LOGOUT',
      tablaAfectada: 'usuario',
      registroId: req.user.id,
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh — emite un nuevo token para el usuario autenticado
async function refresh(req, res, next) {
  try {
    const token = jwt.sign(
      { id: req.user.id, rol: req.user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
    );
    return res.json({ token });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, refresh };
