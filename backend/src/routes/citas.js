'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole    = require('../middlewares/requireRole');
const ctrl = require('../controllers/citasController');

const router = Router();

// Todos los endpoints requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Citas
 *   description: Gestión de citas médicas (RN-01 — sin traslapes de horario)
 *
 * /citas:
 *   get:
 *     summary: Listar citas con filtros — RF-18
 *     tags: [Citas]
 *     parameters:
 *       - in: query
 *         name: medico
 *         schema: { type: string }
 *         description: Filtrar por medicoId
 *       - in: query
 *         name: fecha
 *         schema: { type: string, format: date, example: "2026-04-10" }
 *         description: Filtrar por día (devuelve todas las citas de ese día)
 *     responses:
 *       200: { description: Lista de citas }
 *       422: { description: Fecha inválida }
 *   post:
 *     summary: Crear cita — RF-16
 *     tags: [Citas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pacienteId, medicoId, tipoConsultaId, fechaHoraInicio, fechaHoraFin]
 *             properties:
 *               pacienteId:      { type: string }
 *               medicoId:        { type: string }
 *               tipoConsultaId:  { type: string }
 *               fechaHoraInicio: { type: string, format: date-time, example: "2026-04-10T09:00:00" }
 *               fechaHoraFin:    { type: string, format: date-time, example: "2026-04-10T09:30:00" }
 *               notasSecretaria: { type: string }
 *     responses:
 *       201: { description: Cita creada }
 *       404: { description: Paciente, médico o tipo de consulta no encontrado }
 *       409: { description: Horario ocupado (RN-01) }
 *       422: { description: Error de validación }
 *
 * /citas/{id}:
 *   patch:
 *     summary: Cambiar estado de cita — RF-19 + RF-20
 *     tags: [Citas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:            { type: string, enum: [confirmada, en_sala, atendida, cancelada, no_presentada] }
 *               motivoCancelacion: { type: string, description: "Requerido si estado=cancelada (RN-05)" }
 *               notasSecretaria:   { type: string }
 *     responses:
 *       200: { description: Cita actualizada }
 *       404: { description: Cita no encontrada }
 *       409: { description: Estado final, consulta existente }
 *       422: { description: Error de validación }
 *
 * /citas/{id}/reagendar:
 *   patch:
 *     summary: Reagendar cita a nuevo horario
 *     tags: [Citas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fechaHoraInicio, fechaHoraFin]
 *             properties:
 *               fechaHoraInicio: { type: string, format: date-time }
 *               fechaHoraFin:    { type: string, format: date-time }
 *               notasSecretaria: { type: string }
 *     responses:
 *       200: { description: Cita reagendada, estado vuelve a pendiente }
 *       404: { description: Cita no encontrada }
 *       409: { description: Estado final o horario ocupado }
 *       422: { description: Error de validación }
 */
// POST /api/citas — secretaria y admin pueden crear
router.post(
  '/',
  requireRole(['secretaria', 'administrador', 'medico']),
  ctrl.crear
);

// GET /api/citas?medico=&fecha= — todos los roles autenticados
router.get('/', ctrl.listar);

// PATCH /api/citas/:id — cambiar estado
router.patch(
  '/:id',
  requireRole(['secretaria', 'administrador', 'medico']),
  ctrl.cambiarEstado
);

// PATCH /api/citas/:id/reagendar — cambiar horario
router.patch(
  '/:id/reagendar',
  requireRole(['secretaria', 'administrador']),
  ctrl.reagendar
);

module.exports = router;
