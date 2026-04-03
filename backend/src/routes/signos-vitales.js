'use strict';

const { Router } = require('express');
const { crear } = require('../controllers/signosVitalesController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: SignosVitales
 *   description: Registro de signos vitales por cita (enfermera o médico)
 *
 * /signos-vitales:
 *   post:
 *     summary: Registrar signos vitales de una cita — RF-11
 *     tags: [SignosVitales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [citaId]
 *             properties:
 *               citaId:          { type: string, example: "uuid-de-la-cita" }
 *               presionSistolica:  { type: integer, example: 120 }
 *               presionDiastolica: { type: integer, example: 80 }
 *               frecuenciaCardiaca: { type: integer, example: 72 }
 *               frecuenciaRespiratoria: { type: integer, example: 16 }
 *               temperatura:     { type: number, example: 36.6 }
 *               peso:            { type: number, example: 70.5 }
 *               talla:           { type: number, example: 1.75 }
 *               saturacionOxigeno: { type: integer, example: 98 }
 *               observaciones:   { type: string }
 *     responses:
 *       201: { description: Signos registrados }
 *       404: { description: Cita no encontrada }
 *       409: { description: La cita ya tiene signos vitales registrados }
 *       422: { description: Error de validación }
 */
// POST /api/signos-vitales — RF-11: enfermera o médico
router.post('/', authMiddleware, requireRole(['enfermera', 'medico']), crear);

module.exports = router;
