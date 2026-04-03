'use strict';
const multer = require('multer');
const svc = require('../services/documentosService');
const errorResponse = require('../utils/errorResponse');

const TAMANO_MAX = 10 * 1024 * 1024; // 10 MB
const MIMES_PERMITIDOS = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Multer — almacenamiento en memoria (middleware HTTP, se queda en el controller)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAX },
  fileFilter: (_req, file, cb) => {
    if (MIMES_PERMITIDOS.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Se aceptan PDF, imágenes y documentos Word.'));
    }
  },
});

// GET /api/documentos/:expedienteId
async function listar(req, res, next) {
  try {
    const documentos = await svc.listar(req.params.expedienteId);
    return res.json(documentos);
  } catch (err) {
    next(err);
  }
}

// POST /api/documentos
async function subir(req, res, next) {
  try {
    if (!req.file) {
      return res.status(422).json(errorResponse('No se recibió ningún archivo', 'ARCHIVO_REQUERIDO'));
    }
    const { expedienteId, descripcion } = req.body;
    if (!expedienteId) {
      return res.status(422).json(errorResponse('expedienteId es requerido', 'VALIDATION_ERROR'));
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const documento = await svc.subir(
      { expedienteId, descripcion, file: req.file },
      { usuarioId: req.user.id, ip, userAgent: req.headers['user-agent'] }
    );
    return res.status(201).json(documento);
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

// DELETE /api/documentos/:id
async function eliminar(req, res, next) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await svc.eliminar(req.params.id, {
      usuarioId: req.user.id,
      userRol:   req.user.rol,
      ip,
      userAgent: req.headers['user-agent'],
    });
    return res.json({ ok: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json(errorResponse(err.message, err.code));
    next(err);
  }
}

module.exports = { upload, listar, subir, eliminar };
