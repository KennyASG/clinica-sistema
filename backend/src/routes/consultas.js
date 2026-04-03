'use strict';

const { Router } = require('express');
const { crear } = require('../controllers/consultasController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Consultas
 *   description: Notas de consulta médica (RN-02 — solo médico tratante)
 *
 * /consultas:
 *   post:
 *     summary: Registrar nota de consulta — RF-10
 *     tags: [Consultas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expedienteId, motivoConsulta, diagnostico]
 *             properties:
 *               expedienteId:      { type: string }
 *               citaId:            { type: string, description: "Opcional. Marca la cita como atendida automáticamente." }
 *               motivoConsulta:    { type: string }
 *               diagnostico:       { type: string }
 *               diagnosticoCie10:  { type: string, example: "J06.9" }
 *               tratamiento:       { type: string }
 *               receta:            { type: string }
 *               observaciones:     { type: string }
 *     responses:
 *       201: { description: Consulta registrada }
 *       404: { description: Expediente o cita no encontrada }
 *       409: { description: Expediente inactivo, cita duplicada o paciente no coincide }
 *       422: { description: Error de validación }
 */
// POST /api/consultas — RF-10: solo médico (RN-02)
router.post('/', authMiddleware, requireRole(['medico']), crear);

module.exports = router;
