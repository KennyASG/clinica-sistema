'use strict';

/**
 * Crea un objeto de error con la estructura uniforme del proyecto.
 * { error: true, message: string, code: string }
 */
function errorResponse(message, code = 'ERROR') {
  return { error: true, message, code };
}

module.exports = errorResponse;
