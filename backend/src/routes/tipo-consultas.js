'use strict';
const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/requireRole');
const c    = require('../controllers/tipoConsultasController');

const router = Router();
router.use(auth);
const admin = role(['administrador']);

router.get('/',       c.listar);
router.post('/',      admin, c.crear);
router.patch('/:id',  admin, c.editar);
router.delete('/:id', admin, c.desactivar);

module.exports = router;
