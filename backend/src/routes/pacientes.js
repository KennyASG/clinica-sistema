'use strict';

const { Router } = require('express');
const { buscar, crear, obtener } = require('../controllers/pacientesController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();
router.use(authMiddleware);

// GET /api/pacientes?q=   — RF-09: búsqueda difusa
router.get('/', buscar);

// POST /api/pacientes     — RF-07: crear paciente + expediente
router.post('/', crear);

// GET /api/pacientes/:id  — detalle con expediente
router.get('/:id', obtener);

module.exports = router;
