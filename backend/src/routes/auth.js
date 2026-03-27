'use strict';

const { Router } = require('express');
const { login, logout } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// POST /api/auth/login — RF-01
router.post('/login', login);

// POST /api/auth/logout — RF-05 (requiere token válido)
router.post('/logout', authMiddleware, logout);

module.exports = router;
