'use strict';
const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/requireRole');
const c    = require('../controllers/tipoConsultasController');

const router = Router();
router.use(auth);
const admin = role(['administrador']);

/**
 * @swagger
 * tags:
 *   name: TipoConsultas
 *   description: Catálogo de tipos de consulta
 *
 * /tipo-consultas:
 *   get:
 *     summary: Listar tipos de consulta activos
 *     tags: [TipoConsultas]
 *     responses:
 *       200:
 *         description: Lista de tipos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:              { type: string }
 *                   nombre:          { type: string }
 *                   duracionMinutos: { type: integer }
 *                   descripcion:     { type: string }
 *   post:
 *     summary: Crear tipo de consulta (admin)
 *     tags: [TipoConsultas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:          { type: string, example: Consulta general }
 *               descripcion:     { type: string }
 *               duracionMinutos: { type: integer, example: 30 }
 *     responses:
 *       201: { description: Tipo creado }
 *       422: { description: Error de validación }
 *
 * /tipo-consultas/{id}:
 *   patch:
 *     summary: Editar tipo de consulta (admin)
 *     tags: [TipoConsultas]
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
 *               nombre:          { type: string }
 *               descripcion:     { type: string }
 *               duracionMinutos: { type: integer }
 *               activo:          { type: boolean }
 *     responses:
 *       200: { description: Tipo actualizado }
 *   delete:
 *     summary: Desactivar tipo de consulta (admin)
 *     tags: [TipoConsultas]
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
router.get('/',       c.listar);
router.post('/',      admin, c.crear);
router.patch('/:id',  admin, c.editar);
router.delete('/:id', admin, c.desactivar);

module.exports = router;
