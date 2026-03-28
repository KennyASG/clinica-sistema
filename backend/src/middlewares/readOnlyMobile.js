'use strict';

const errorResponse = require('../utils/errorResponse');

const METODOS_ESCRITURA = ['POST', 'PATCH', 'PUT', 'DELETE'];

/**
 * RF-26 — Bloquea escritura cuando el request viene de la app móvil.
 * La app envía el header X-App-Source: mobile en cada request (ver mobile/src/services/api.js).
 */
function readOnlyMobile(req, res, next) {
  if (
    req.headers['x-app-source'] === 'mobile' &&
    METODOS_ESCRITURA.includes(req.method)
  ) {
    return res.status(403).json(
      errorResponse('La app móvil es de solo lectura', 'MOBILE_READ_ONLY')
    );
  }
  next();
}

module.exports = readOnlyMobile;
