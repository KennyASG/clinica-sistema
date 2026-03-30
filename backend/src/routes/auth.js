'use strict';

const { Router } = require('express');
const { login, logout, refresh } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// POST /api/auth/login — RF-01
router.post('/login', login);

// POST /api/auth/logout — RF-05 (requiere token válido)
router.post('/logout', authMiddleware, logout);

// POST /api/auth/refresh — renueva el token antes de que expire
router.post('/refresh', authMiddleware, refresh);

module.exports = router;
