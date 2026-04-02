'use strict';

const { Router } = require('express');
const { login, logout, refresh, forgotPassword, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: admin@clinica.gt }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200: { description: Token JWT }
 *       401: { description: Credenciales incorrectas }
 */
router.post('/login', login);

// POST /api/auth/logout — RF-05 (requiere token válido)
router.post('/logout', authMiddleware, logout);

// POST /api/auth/refresh — renueva el token antes de que expire
router.post('/refresh', authMiddleware, refresh);

// POST /api/auth/forgot-password — solicita enlace de restablecimiento
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password — aplica la nueva contraseña con el token recibido
router.post('/reset-password', resetPassword);

module.exports = router;
