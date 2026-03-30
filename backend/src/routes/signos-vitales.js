'use strict';

const { Router } = require('express');
const { crear } = require('../controllers/signosVitalesController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

// POST /api/signos-vitales — RF-11: enfermera o médico
router.post('/', authMiddleware, requireRole(['enfermera', 'medico']), crear);

module.exports = router;
