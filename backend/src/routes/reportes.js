'use strict';
const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/requireRole');
const c    = require('../controllers/reportesController');

const router = Router();
const adminMedico = role(['administrador', 'medico']);

/**
 * @swagger
 * /reportes/citas:
 *   get:
 *     summary: Reporte de citas por rango de fechas
 *     tags: [Reportes]
 *     parameters:
 *       - { in: query, name: desde,    schema: { type: string, format: date }, example: "2026-04-01" }
 *       - { in: query, name: hasta,    schema: { type: string, format: date }, example: "2026-04-30" }
 *       - { in: query, name: medicoId, schema: { type: string } }
 *       - { in: query, name: estado,   schema: { type: string, enum: [pendiente, confirmada, en_atencion, atendida, cancelada] } }
 *     responses:
 *       200: { description: Lista de citas con resumen }
 */
router.get('/citas',          auth, adminMedico, c.reporteCitas);

/**
 * @swagger
 * /reportes/citas/pdf:
 *   get:
 *     summary: Exportar reporte de citas a PDF
 *     tags: [Reportes]
 *     parameters:
 *       - { in: query, name: desde,    schema: { type: string, format: date }, example: "2026-04-01" }
 *       - { in: query, name: hasta,    schema: { type: string, format: date }, example: "2026-04-30" }
 *       - { in: query, name: medicoId, schema: { type: string } }
 *       - { in: query, name: estado,   schema: { type: string } }
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
router.get('/citas/pdf',      auth, adminMedico, c.reporteCitasPDF);

/**
 * @swagger
 * /reportes/pacientes:
 *   get:
 *     summary: Reporte de pacientes atendidos
 *     tags: [Reportes]
 *     parameters:
 *       - { in: query, name: desde,    schema: { type: string, format: date }, example: "2026-04-01" }
 *       - { in: query, name: hasta,    schema: { type: string, format: date }, example: "2026-04-30" }
 *       - { in: query, name: medicoId, schema: { type: string } }
 *     responses:
 *       200: { description: Lista de consultas agrupadas por médico }
 */
router.get('/pacientes',      auth, adminMedico, c.reportePacientes);

/**
 * @swagger
 * /reportes/pacientes/pdf:
 *   get:
 *     summary: Exportar reporte de pacientes a PDF
 *     tags: [Reportes]
 *     parameters:
 *       - { in: query, name: desde,    schema: { type: string, format: date }, example: "2026-04-01" }
 *       - { in: query, name: hasta,    schema: { type: string, format: date }, example: "2026-04-30" }
 *       - { in: query, name: medicoId, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
router.get('/pacientes/pdf',  auth, adminMedico, c.reportePacientesPDF);

module.exports = router;
