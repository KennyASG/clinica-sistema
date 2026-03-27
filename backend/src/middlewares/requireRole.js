'use strict';

/**
 * Middleware de autorización por rol.
 * Uso: requireRole(['administrador', 'medico'])
 * Debe ejecutarse DESPUÉS de authMiddleware.
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'No autenticado',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: true,
        message: 'No tienes permiso para realizar esta acción',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}

module.exports = requireRole;
