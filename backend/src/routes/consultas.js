'use strict';

const { Router } = require('express');
const { crear } = require('../controllers/consultasController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

// POST /api/consultas — RF-10: solo médico (RN-02)
router.post('/', authMiddleware, requireRole(['medico']), crear);

module.exports = router;
