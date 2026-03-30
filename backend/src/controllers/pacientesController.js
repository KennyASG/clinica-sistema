'use strict';

const { Prisma } = require('@prisma/client');
const prisma = require('../utils/prismaClient');
const errorResponse = require('../utils/errorResponse');
const registrarAuditoria = require('../utils/auditoria');
const { crearPacienteSchema, editarPacienteSchema } = require('../validators/pacientes');

// GET /api/pacientes?q= — RF-09
// Búsqueda difusa por nombre (pg_trgm) o exacta por DPI
async function buscar(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const esDPI = /^\d{6,15}$/.test(q);

    let pacientes;
    if (esDPI) {
      pacientes = await prisma.paciente.findMany({
        where: { dpi: { contains: q }, activo: true },
        select: { id: true, nombreCompleto: true, dpi: true, telefono: true, fechaNacimiento: true, sexo: true },
        take: 20,
      });
    } else {
      // Búsqueda difusa con pg_trgm — safe usando tagged template literal de Prisma
      // unaccent normaliza tildes para que 'garcia' encuentre 'García'
      pacientes = await prisma.$queryRaw`
        SELECT id, nombre_completo AS "nombreCompleto", dpi, telefono,
               fecha_nacimiento AS "fechaNacimiento", sexo
        FROM paciente
        WHERE activo = true
          AND (
            similarity(unaccent(lower(nombre_completo)), unaccent(lower(${q}))) > 0.15
            OR unaccent(lower(nombre_completo)) LIKE unaccent(lower(${'%' + q + '%'}))
          )
        ORDER BY similarity(unaccent(lower(nombre_completo)), unaccent(lower(${q}))) DESC
        LIMIT 20
      `;
    }

    return res.json(pacientes);
  } catch (err) {
    next(err);
  }
}

// POST /api/pacientes — RF-07 + RF-08
// Crea paciente y expediente vacío en una sola transacción
async function crear(req, res, next) {
  try {
    const parsed = crearPacienteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const datos = parsed.data;
    // Prisma requiere Date object para campos @db.Date
    datos.fechaNacimiento = new Date(datos.fechaNacimiento);

    const existe = await prisma.paciente.findUnique({ where: { dpi: datos.dpi } });
    if (existe) {
      return res.status(409).json(errorResponse('Ya existe un paciente con ese DPI', 'DPI_DUPLICATE'));
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const { paciente, expediente } = await prisma.$transaction(async (tx) => {
      const p = await tx.paciente.create({
        data: { ...datos, creadoPorId: req.user.id },
      });

      const e = await tx.expediente.create({
        data: { pacienteId: p.id, creadoPorId: req.user.id },
      });

      await registrarAuditoria(tx, {
        usuarioId: req.user.id,
        accion: 'INSERT',
        tablaAfectada: 'paciente',
        registroId: p.id,
        datosNuevos: { nombreCompleto: p.nombreCompleto, dpi: p.dpi },
        ip,
        userAgent: req.headers['user-agent'],
      });

      return { paciente: p, expediente: e };
    });

    return res.status(201).json({ ...paciente, expedienteId: expediente.id });
  } catch (err) {
    next(err);
  }
}

// GET /api/pacientes/:id — detalle con expediente
async function obtener(req, res, next) {
  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id: req.params.id },
      include: {
        expediente: {
          select: {
            id: true,
            tipoSangre: true,
            tieneAlergias: true,
            alergias: true,
            enfermedadesCronicas: true,
            medicamentosPermanentes: true,
            antecedentesFamiliares: true,
            antecedentesQuirurgicos: true,
            antecedentesTraumaticos: true,
            observacionesGenerales: true,
            activo: true,
            actualizadoEn: true,
          },
        },
      },
    });

    if (!paciente) {
      return res.status(404).json(errorResponse('Paciente no encontrado', 'NOT_FOUND'));
    }

    return res.json(paciente);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/pacientes/:id — editar datos de contacto del paciente
async function editar(req, res, next) {
  try {
    const parsed = editarPacienteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }

    const paciente = await prisma.paciente.findUnique({ where: { id: req.params.id } });
    if (!paciente) return res.status(404).json(errorResponse('Paciente no encontrado', 'NOT_FOUND'));

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const actualizado = await prisma.$transaction(async (tx) => {
      const p = await tx.paciente.update({
        where: { id: req.params.id },
        data: parsed.data,
      });
      await registrarAuditoria(tx, {
        usuarioId: req.user.id,
        accion: 'UPDATE',
        tablaAfectada: 'paciente',
        registroId: p.id,
        datosAnteriores: { telefono: paciente.telefono, correo: paciente.correo },
        datosNuevos: parsed.data,
        ip,
        userAgent: req.headers['user-agent'],
      });
      return p;
    });

    return res.json(actualizado);
  } catch (err) {
    next(err);
  }
}

module.exports = { buscar, crear, obtener, editar };
