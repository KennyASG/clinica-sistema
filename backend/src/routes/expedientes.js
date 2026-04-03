'use strict';

const { Router } = require('express');
const { obtener, editar, metodNoPermitido, historial, recientes } = require('../controllers/expedientesController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Expedientes
 *   description: Expedientes médicos de pacientes (RN-03 — nunca se eliminan)
 *
 * /expedientes/recientes:
 *   get:
 *     summary: Últimos 8 expedientes modificados
 *     tags: [Expedientes]
 *     responses:
 *       200:
 *         description: Lista de expedientes recientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:           { type: string }
 *                   tieneAlergias: { type: boolean }
 *                   actualizadoEn: { type: string, format: date-time }
 *                   paciente:     { type: object }
 *
 * /expedientes/{id}:
 *   get:
 *     summary: Obtener expediente con datos del paciente
 *     tags: [Expedientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Expediente completo }
 *       404: { description: Expediente no encontrado }
 *   patch:
 *     summary: Editar expediente — RF-12
 *     tags: [Expedientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipoSangre:               { type: string, example: "O+" }
 *               alergias:                 { type: string }
 *               enfermedadesCronicas:     { type: string }
 *               medicamentosPermanentes:  { type: string }
 *               antecedentesFamiliares:   { type: string }
 *               antecedentesQuirurgicos:  { type: string }
 *               antecedentesTraumaticos:  { type: string }
 *               observacionesGenerales:   { type: string }
 *               activo:                   { type: boolean, description: "RN-03: usar false en lugar de DELETE" }
 *     responses:
 *       200: { description: Expediente actualizado }
 *       404: { description: Expediente no encontrado }
 *       422: { description: Error de validación }
 *   delete:
 *     summary: "No permitido — RN-03"
 *     tags: [Expedientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       405: { description: "Los expedientes no pueden eliminarse. Use PATCH activo:false" }
 *
 * /expedientes/{id}/historial:
 *   get:
 *     summary: Historial de consultas del expediente — RF-14
 *     tags: [Expedientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de consultas ordenadas más reciente primero }
 *       404: { description: Expediente no encontrado }
 */
// GET    /api/expedientes/recientes      — últimos 8 modificados (debe ir antes de /:id)
router.get('/recientes', recientes);

// GET    /api/expedientes/:id            — ver expediente
router.get('/:id', obtener);

// PATCH  /api/expedientes/:id            — editar (RF-12, RN-03)
router.patch('/:id', editar);

// DELETE /api/expedientes/:id            — RN-03: siempre 405
router.delete('/:id', metodNoPermitido);

// GET    /api/expedientes/:id/historial  — RF-14
router.get('/:id/historial', historial);

module.exports = router;
