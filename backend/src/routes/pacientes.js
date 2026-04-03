'use strict';

const { Router } = require('express');
const { buscar, crear, obtener, editar } = require('../controllers/pacientesController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Pacientes
 *   description: Gestión de pacientes y expedientes
 *
 * /pacientes:
 *   get:
 *     summary: Buscar pacientes por nombre o DPI — RF-09
 *     tags: [Pacientes]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, example: "García" }
 *         description: Mínimo 2 caracteres. Solo dígitos activa búsqueda por DPI parcial.
 *     responses:
 *       200:
 *         description: Lista de hasta 20 pacientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:              { type: string }
 *                   nombreCompleto:  { type: string }
 *                   dpi:             { type: string }
 *                   telefono:        { type: string }
 *                   fechaNacimiento: { type: string, format: date }
 *                   sexo:            { type: string }
 *   post:
 *     summary: Crear paciente + expediente vacío — RF-07 + RF-08
 *     tags: [Pacientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombreCompleto, dpi, fechaNacimiento, sexo]
 *             properties:
 *               nombreCompleto:  { type: string, example: "Juan García López" }
 *               dpi:             { type: string, example: "1234567890101" }
 *               fechaNacimiento: { type: string, format: date, example: "1990-05-15" }
 *               sexo:            { type: string, enum: [M, F] }
 *               telefono:        { type: string }
 *               correo:          { type: string, format: email }
 *               direccion:       { type: string }
 *     responses:
 *       201: { description: Paciente creado con expedienteId }
 *       409: { description: Ya existe un paciente con ese DPI }
 *       422: { description: Error de validación }
 *
 * /pacientes/{id}:
 *   get:
 *     summary: Obtener paciente con expediente
 *     tags: [Pacientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos del paciente con su expediente }
 *       404: { description: Paciente no encontrado }
 *   patch:
 *     summary: Editar datos de contacto del paciente
 *     tags: [Pacientes]
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
 *               telefono:  { type: string }
 *               correo:    { type: string, format: email }
 *               direccion: { type: string }
 *     responses:
 *       200: { description: Paciente actualizado }
 *       404: { description: Paciente no encontrado }
 *       422: { description: Error de validación }
 */
// GET /api/pacientes?q=   — RF-09: búsqueda difusa
router.get('/', buscar);

// POST /api/pacientes     — RF-07: crear paciente + expediente
router.post('/', crear);

// GET /api/pacientes/:id  — detalle con expediente
router.get('/:id', obtener);

// PATCH /api/pacientes/:id — editar datos de contacto
router.patch('/:id', editar);

module.exports = router;
