'use strict';
const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/requireRole');
const c    = require('../controllers/horariosController');

const router = Router();
const admin  = role(['administrador']);

/**
 * @swagger
 * tags:
 *   name: Horarios
 *   description: Horarios de atención de médicos
 *
 * /horarios:
 *   get:
 *     summary: Listar horarios activos
 *     tags: [Horarios]
 *     parameters:
 *       - in: query
 *         name: medicoId
 *         schema: { type: string }
 *         description: Filtrar por médico (opcional)
 *     responses:
 *       200:
 *         description: Lista de horarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:             { type: string }
 *                   medicoId:       { type: string }
 *                   dia:            { type: integer, description: "0=Domingo, 1=Lunes … 6=Sábado" }
 *                   horaInicio:     { type: string, example: "08:00" }
 *                   horaFin:        { type: string, example: "17:00" }
 *                   duracionCitaMin: { type: integer, example: 30 }
 *                   medico:         { type: object, properties: { nombreCompleto: { type: string } } }
 *   post:
 *     summary: Crear horario de médico (admin)
 *     tags: [Horarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [medicoId, dia, horaInicio, horaFin]
 *             properties:
 *               medicoId:        { type: string }
 *               dia:             { type: integer, example: 1, description: "0=Domingo … 6=Sábado" }
 *               horaInicio:      { type: string, example: "08:00" }
 *               horaFin:         { type: string, example: "17:00" }
 *               duracionCitaMin: { type: integer, example: 30 }
 *     responses:
 *       201: { description: Horario creado }
 *
 * /horarios/{id}:
 *   patch:
 *     summary: Editar horario (admin)
 *     tags: [Horarios]
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
 *               horaInicio:      { type: string }
 *               horaFin:         { type: string }
 *               duracionCitaMin: { type: integer }
 *               activo:          { type: boolean }
 *     responses:
 *       200: { description: Horario actualizado }
 *   delete:
 *     summary: Desactivar horario (admin)
 *     tags: [Horarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Desactivado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 */
router.get('/',    auth, role(['administrador', 'secretaria', 'medico']), c.listar);
router.post('/',   auth, admin, c.crear);
router.patch('/:id', auth, admin, c.editar);
router.delete('/:id', auth, admin, c.desactivar);

module.exports = router;
