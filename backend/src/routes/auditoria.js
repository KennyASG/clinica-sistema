'use strict';
const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/requireRole');
const { listar } = require('../controllers/auditoriaController');

const router = Router();

router.get('/', auth, role(['administrador']), listar);

module.exports = router;
