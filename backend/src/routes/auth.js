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

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión — RF-05
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Sesión cerrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *
 * /auth/refresh:
 *   post:
 *     summary: Renovar token JWT antes de que expire
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Nuevo token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar enlace de restablecimiento de contraseña
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Respuesta siempre exitosa (no revela si el email existe)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *
 * /auth/reset-password:
 *   post:
 *     summary: Aplicar nueva contraseña con token de reset
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:    { type: string, description: "Token JWT recibido por correo" }
 *               password: { type: string, example: "NuevaSegura123!" }
 *     responses:
 *       200: { description: Contraseña actualizada }
 *       400: { description: Token expirado o inválido }
 *       422: { description: Error de validación }
 */
// POST /api/auth/logout — RF-05 (requiere token válido)
router.post('/logout', authMiddleware, logout);

// POST /api/auth/refresh — renueva el token antes de que expire
router.post('/refresh', authMiddleware, refresh);

// POST /api/auth/forgot-password — solicita enlace de restablecimiento
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password — aplica la nueva contraseña con el token recibido
router.post('/reset-password', resetPassword);

module.exports = router;
