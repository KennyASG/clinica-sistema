'use strict';

const { Router } = require('express');
const { obtener, editar, metodNoPermitido, historial, recientes } = require('../controllers/expedientesController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();
router.use(authMiddleware);

// GET    /api/expedientes/recientes      — últimos 8 modificados (debe ir antes de /:id)
router.get('/recientes', recientes);

// GET    /api/expedientes/:id            — ver expediente
router.get('/:id', obtener);

// PATCH  /api/expedientes/:id            — editar (RF-12, RN-03)
router.patch('/:id', editar);

// DELETE /api/expedientes/:id            — RN-03: siempre 405
router.delete('/:id', metodNoPermitido);

// GET    /api/expedientes/:id/historial  — RF-14
router.get('/:id/historial', historial);

module.exports = router;
