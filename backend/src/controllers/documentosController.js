'use strict';

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../utils/prismaClient');
const errorResponse = require('../utils/errorResponse');
const registrarAuditoria = require('../utils/auditoria');

const TAMANO_MAX = 10 * 1024 * 1024; // 10 MB
const MIMES_PERMITIDOS = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// ── Multer — almacenamiento en memoria ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAX },
  fileFilter: (_req, file, cb) => {
    if (MIMES_PERMITIDOS.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Se aceptan PDF, imágenes y documentos Word.'));
    }
  },
});

// ── Cliente S3 ────────────────────────────────
function crearS3() {
  const { DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_REGION, DO_SPACES_ENDPOINT } = process.env;
  if (!DO_SPACES_KEY || !DO_SPACES_SECRET) return null;

  const region   = DO_SPACES_REGION   || 'sfo3';
  const endpoint = DO_SPACES_ENDPOINT || `https://${region}.digitaloceanspaces.com`;

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: DO_SPACES_KEY, secretAccessKey: DO_SPACES_SECRET },
  });
}

// GET /api/documentos/:expedienteId — lista archivos de un expediente
async function listar(req, res, next) {
  try {
    const documentos = await prisma.documentoAdjunto.findMany({
      where:   { expedienteId: req.params.expedienteId },
      include: { subidoPor: { select: { nombreCompleto: true } } },
      orderBy: { subidoEn: 'desc' },
    });
    return res.json(documentos);
  } catch (err) {
    next(err);
  }
}

// POST /api/documentos — sube archivo al expediente
async function subir(req, res, next) {
  try {
    if (!req.file) {
      return res.status(422).json(errorResponse('No se recibió ningún archivo', 'ARCHIVO_REQUERIDO'));
    }

    const { expedienteId, descripcion } = req.body;
    if (!expedienteId) {
      return res.status(422).json(errorResponse('expedienteId es requerido', 'VALIDATION_ERROR'));
    }

    const expediente = await prisma.expediente.findUnique({ where: { id: expedienteId } });
    if (!expediente) {
      return res.status(404).json(errorResponse('Expediente no encontrado', 'NOT_FOUND'));
    }

    const s3 = crearS3();
    if (!s3) {
      return res.status(503).json(errorResponse('Almacenamiento no configurado', 'STORAGE_NOT_CONFIGURED'));
    }

    
    const ext      = path.extname(req.file.originalname);
    const clave    = `expedientes/${expedienteId}/${crypto.randomUUID()}${ext}`;
    const bucket   = process.env.DO_SPACES_BUCKET || 'clinica-files';

    await s3.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         clave,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
      ACL:         'public-read',
    }));

    const region   = process.env.SPACES_REGION   || 'sfo3';
    const urlStorage = `https://${bucket}.${region}.digitaloceanspaces.com/${clave}`;

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const documento = await prisma.$transaction(async (tx) => {
      const doc = await tx.documentoAdjunto.create({
        data: {
          expedienteId,
          nombreArchivo: req.file.originalname,
          descripcion:   descripcion || null,
          urlStorage,
          tipoMime:      req.file.mimetype,
          tamanoBytes:   req.file.size,
          subidoPorId:   req.user.id,
        },
      });

      await registrarAuditoria(tx, {
        usuarioId:     req.user.id,
        accion:        'INSERT',
        tablaAfectada: 'documento_adjunto',
        registroId:    doc.id,
        datosNuevos:   { nombreArchivo: doc.nombreArchivo, expedienteId },
        ip,
        userAgent: req.headers['user-agent'],
      });

      return doc;
    });

    return res.status(201).json(documento);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/documentos/:id — eliminar archivo del expediente y s3
async function eliminar(req, res, next) {
  try {
    const documento = await prisma.documentoAdjunto.findUnique({ where: { id: req.params.id } });
    if (!documento) {
      return res.status(404).json(errorResponse('Documento no encontrado', 'NOT_FOUND'));
    }

    // Solo el médico o el que subió el archivo puede eliminarlo
    const puedeEliminar = req.user.rol === 'administrador' || documento.subidoPorId === req.user.id;
    if (!puedeEliminar) {
      return res.status(403).json(errorResponse('No tienes permiso para eliminar este archivo', 'FORBIDDEN'));
    }

    const s3 = crearS3();
    if (s3) {
      const bucket = process.env.DO_SPACES_BUCKET || 'clinica-files';
      const clave  = new URL(documento.urlStorage).pathname.replace(/^\//, '');
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: clave }));
      } catch {
        
        console.error('[documentos] No se pudo eliminar de Spaces:', documento.urlStorage);
      }
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await prisma.$transaction(async (tx) => {
      await tx.documentoAdjunto.delete({ where: { id: req.params.id } });
      await registrarAuditoria(tx, {
        usuarioId:     req.user.id,
        accion:        'DELETE',
        tablaAfectada: 'documento_adjunto',
        registroId:    req.params.id,
        datosAnteriores: { nombreArchivo: documento.nombreArchivo },
        ip,
        userAgent: req.headers['user-agent'],
      });
    });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, listar, subir, eliminar };
