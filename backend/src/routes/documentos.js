'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole    = require('../middlewares/requireRole');
const { upload, listar, subir, eliminar } = require('../controllers/documentosController');

const router = Router();

router.get('/:expedienteId', authMiddleware, listar);

// SUBIDA DE ARCHIVOS
router.post(
  '/',
  authMiddleware,
  requireRole(['medico', 'enfermera', 'secretaria', 'administrador']),
  upload.single('archivo'),
  subir,
);

// RESTRICCION POR DUEÑO DE ARCHIVO SUBIDO
router.delete(
  '/:id',
  authMiddleware,
  requireRole(['medico', 'enfermera', 'secretaria', 'administrador']),
  eliminar,
);

module.exports = router;
