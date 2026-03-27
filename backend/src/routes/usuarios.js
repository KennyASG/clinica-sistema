'use strict';

const { Router } = require('express');
const { listar, crear, editar } = require('../controllers/usuariosController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

// Todos los endpoints de usuarios requieren auth + rol administrador
router.use(authMiddleware, requireRole(['administrador']));

// GET  /api/usuarios       — RF-02: listar usuarios
router.get('/', listar);

// POST /api/usuarios       — RF-02: crear usuario
router.post('/', crear);

// PATCH /api/usuarios/:id  — RF-03: editar / desactivar usuario
router.patch('/:id', editar);

module.exports = router;
