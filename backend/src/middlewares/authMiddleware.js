'use strict';

const jwt = require('jsonwebtoken');

/**
 * Verifica el JWT en el header Authorization.
 * Adjunta el payload decodificado en req.user.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'Token de autenticación requerido',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      error: true,
      message: 'Token inválido o expirado',
      code: 'INVALID_TOKEN',
    });
  }
}

module.exports = authMiddleware;
