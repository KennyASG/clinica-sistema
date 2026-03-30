'use strict';
const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/requireRole');
const c    = require('../controllers/horariosController');

const router = Router();
const admin  = role(['administrador']);

router.get('/',    auth, role(['administrador', 'secretaria', 'medico']), c.listar);
router.post('/',   auth, admin, c.crear);
router.patch('/:id', auth, admin, c.editar);
router.delete('/:id', auth, admin, c.desactivar);

module.exports = router;
