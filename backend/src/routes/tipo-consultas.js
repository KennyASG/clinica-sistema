'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { listar } = require('../controllers/tipoConsultasController');

const router = Router();

router.use(authMiddleware);
router.get('/', listar);

module.exports = router;
