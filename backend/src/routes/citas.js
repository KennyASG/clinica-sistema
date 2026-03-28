'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole    = require('../middlewares/requireRole');
const ctrl           = require('../controllers/citasController');

const router = Router();

// Todos los endpoints requieren autenticación
router.use(authMiddleware);

// POST /api/citas — secretaria y admin pueden crear
router.post(
  '/',
  requireRole(['secretaria', 'administrador', 'medico']),
  ctrl.crear
);

// GET /api/citas?medico=&fecha= — todos los roles autenticados
router.get('/', ctrl.listar);

// PATCH /api/citas/:id — secretaria, admin, médico
router.patch(
  '/:id',
  requireRole(['secretaria', 'administrador', 'medico']),
  ctrl.cambiarEstado
);

module.exports = router;
