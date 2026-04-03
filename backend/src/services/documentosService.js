'use strict';
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../utils/prismaClient');
const registrarAuditoria = require('../utils/auditoria');

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

// GET /api/documentos/:expedienteId
async function listar(expedienteId) {
  return prisma.documentoAdjunto.findMany({
    where:   { expedienteId },
    include: { subidoPor: { select: { nombreCompleto: true } } },
    orderBy: { subidoEn: 'desc' },
  });
}

// POST /api/documentos
async function subir({ expedienteId, descripcion, file }, { usuarioId, ip, userAgent }) {
  const expediente = await prisma.expediente.findUnique({ where: { id: expedienteId } });
  if (!expediente) {
    const err = new Error('Expediente no encontrado'); err.code = 'NOT_FOUND'; err.status = 404; throw err;
  }

  const s3 = crearS3();
  if (!s3) {
    const err = new Error('Almacenamiento no configurado'); err.code = 'STORAGE_NOT_CONFIGURED'; err.status = 503; throw err;
  }

  const ext    = path.extname(file.originalname);
  const clave  = `expedientes/${expedienteId}/${crypto.randomUUID()}${ext}`;
  const bucket = process.env.DO_SPACES_BUCKET || 'clinica-files';

  await s3.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         clave,
    Body:        file.buffer,
    ContentType: file.mimetype,
    ACL:         'public-read',
  }));

  const region     = process.env.SPACES_REGION || 'sfo3';
  const urlStorage = `https://${bucket}.${region}.digitaloceanspaces.com/${clave}`;

  return prisma.$transaction(async (tx) => {
    const doc = await tx.documentoAdjunto.create({
      data: {
        expedienteId,
        nombreArchivo: file.originalname,
        descripcion:   descripcion || null,
        urlStorage,
        tipoMime:      file.mimetype,
        tamanoBytes:   file.size,
        subidoPorId:   usuarioId,
      },
    });

    await registrarAuditoria(tx, {
      usuarioId,
      accion:        'INSERT',
      tablaAfectada: 'documento_adjunto',
      registroId:    doc.id,
      datosNuevos:   { nombreArchivo: doc.nombreArchivo, expedienteId },
      ip,
      userAgent,
    });

    return doc;
  });
}

// DELETE /api/documentos/:id
async function eliminar(id, { usuarioId, userRol, ip, userAgent }) {
  const documento = await prisma.documentoAdjunto.findUnique({ where: { id } });
  if (!documento) {
    const err = new Error('Documento no encontrado'); err.code = 'NOT_FOUND'; err.status = 404; throw err;
  }

  const puedeEliminar = userRol === 'administrador' || documento.subidoPorId === usuarioId;
  if (!puedeEliminar) {
    const err = new Error('No tienes permiso para eliminar este archivo'); err.code = 'FORBIDDEN'; err.status = 403; throw err;
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

  await prisma.$transaction(async (tx) => {
    await tx.documentoAdjunto.delete({ where: { id } });
    await registrarAuditoria(tx, {
      usuarioId,
      accion:        'DELETE',
      tablaAfectada: 'documento_adjunto',
      registroId:    id,
      datosAnteriores: { nombreArchivo: documento.nombreArchivo },
      ip,
      userAgent,
    });
  });
}

module.exports = { listar, subir, eliminar };
