'use strict';
const svc = require('../services/authService');
const errorResponse = require('../utils/errorResponse');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/auth');

async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const resultado = await svc.login(parsed.data, {
      esMobile: req.headers['x-app-source'] === 'mobile',
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.json(resultado);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await svc.logout({ usuarioId: req.user.id, ip, userAgent: req.headers['user-agent'] });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh — emite un nuevo token para el usuario autenticado
async function refresh(req, res, next) {
  try {
    const resultado = svc.refresh({ id: req.user.id, rol: req.user.rol });
    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    await svc.forgotPassword(parsed.data.email);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    await svc.resetPassword(parsed.data);
    return res.json({ ok: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

module.exports = { login, logout, refresh, forgotPassword, resetPassword };
