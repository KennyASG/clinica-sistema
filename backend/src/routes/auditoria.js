'use strict';
const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/requireRole');
const { listar } = require('../controllers/auditoriaController');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auditoría
 *   description: Registro de actividad del sistema (solo administrador)
 *
 * /auditoria:
 *   get:
 *     summary: Listar registros de auditoría con paginación
 *     tags: [Auditoría]
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema: { type: string, format: date, example: "2026-04-01" }
 *       - in: query
 *         name: hasta
 *         schema: { type: string, format: date, example: "2026-04-30" }
 *       - in: query
 *         name: usuarioId
 *         schema: { type: string }
 *       - in: query
 *         name: accion
 *         description: "Valores posibles: INSERT, UPDATE, LOGIN, LOGOUT"
 *         schema: { type: string }
 *       - in: query
 *         name: tabla
 *         description: "Nombre de la tabla afectada, ej: paciente, usuario"
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Página de registros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:     { type: integer }
 *                 page:      { type: integer }
 *                 limit:     { type: integer }
 *                 pages:     { type: integer }
 *                 registros: { type: array, items: { type: object } }
 */
router.get('/', auth, role(['administrador']), listar);

module.exports = router;
