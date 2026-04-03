'use strict';

const { Router } = require('express');
const { listar, crear, editar } = require('../controllers/usuariosController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

// Todos los endpoints de usuarios requieren auth + rol administrador
router.use(authMiddleware, requireRole(['administrador']));

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios del sistema (solo administrador)
 *
 * /usuarios:
 *   get:
 *     summary: Listar todos los usuarios — RF-02
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios con especialidades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:             { type: string }
 *                   nombreCompleto: { type: string }
 *                   email:          { type: string }
 *                   rol:            { type: string, enum: [administrador, medico, enfermera, secretaria] }
 *                   activo:         { type: boolean }
 *                   ultimoAcceso:   { type: string, format: date-time }
 *   post:
 *     summary: Crear usuario — RF-02
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombreCompleto, email, password, rol]
 *             properties:
 *               nombreCompleto:  { type: string, example: "Dra. Ana Pérez" }
 *               email:           { type: string, format: email }
 *               password:        { type: string, example: "Segura123!" }
 *               rol:             { type: string, enum: [administrador, medico, enfermera, secretaria] }
 *               numeroColegiado: { type: string }
 *               telefono:        { type: string }
 *               especialidadIds: { type: array, items: { type: string }, description: "Solo para médicos" }
 *     responses:
 *       201: { description: Usuario creado }
 *       409: { description: Ya existe un usuario con ese email }
 *       422: { description: Error de validación }
 *
 * /usuarios/{id}:
 *   patch:
 *     summary: Editar o desactivar usuario — RF-03
 *     tags: [Usuarios]
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
 *               nombreCompleto:  { type: string }
 *               telefono:        { type: string }
 *               activo:          { type: boolean }
 *               password:        { type: string }
 *               especialidadIds: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Usuario actualizado }
 *       404: { description: Usuario no encontrado }
 *       422: { description: Error de validación }
 */
// GET  /api/usuarios       — RF-02: listar usuarios
router.get('/', listar);

// POST /api/usuarios       — RF-02: crear usuario
router.post('/', crear);

// PATCH /api/usuarios/:id  — RF-03: editar / desactivar usuario
router.patch('/:id', editar);

module.exports = router;
