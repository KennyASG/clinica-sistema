'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole    = require('../middlewares/requireRole');
const { upload, listar, subir, eliminar } = require('../controllers/documentosController');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Documentos
 *   description: Archivos adjuntos de expedientes (PDF, imágenes, Word — máx 10MB)
 *
 * /documentos/{expedienteId}:
 *   get:
 *     summary: Listar documentos de un expediente
 *     tags: [Documentos]
 *     parameters:
 *       - in: path
 *         name: expedienteId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de documentos adjuntos }
 *
 * /documentos:
 *   post:
 *     summary: Subir archivo a un expediente
 *     tags: [Documentos]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [archivo, expedienteId]
 *             properties:
 *               archivo:      { type: string, format: binary }
 *               expedienteId: { type: string }
 *               descripcion:  { type: string }
 *     responses:
 *       201: { description: Documento subido }
 *       404: { description: Expediente no encontrado }
 *       422: { description: Archivo no recibido o expedienteId faltante }
 *       503: { description: Almacenamiento no configurado }
 *
 * /documentos/{id}:
 *   delete:
 *     summary: Eliminar documento (solo quien lo subió o administrador)
 *     tags: [Documentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *       403: { description: Sin permiso para eliminar }
 *       404: { description: Documento no encontrado }
 */
router.get('/:expedienteId', authMiddleware, listar);

// SUBIDA DE ARCHIVOS
router.post(
  '/',
  authMiddleware,
  requireRole(['medico', 'enfermera', 'secretaria', 'administrador']),
  upload.single('archivo'),
  subir,
);

// RESTRICCION POR DUEÑO DE ARCHIVO SUBIDO
router.delete(
  '/:id',
  authMiddleware,
  requireRole(['medico', 'enfermera', 'secretaria', 'administrador']),
  eliminar,
);

module.exports = router;
