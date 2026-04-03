'use strict';
const { Prisma } = require('@prisma/client');
const prisma = require('../utils/prismaClient');
const registrarAuditoria = require('../utils/auditoria');

// GET /api/pacientes?q= — RF-09
async function buscar(q) {
  if (!q || q.length < 2) return [];

  const esDPI = /^\d+$/.test(q);

  if (esDPI) {
    return prisma.paciente.findMany({
      where: { dpi: { contains: q }, activo: true },
      select: { id: true, nombreCompleto: true, dpi: true, telefono: true, fechaNacimiento: true, sexo: true },
      take: 20,
      orderBy: { nombreCompleto: 'asc' },
    });
  }

  const palabras = q.split(/\s+/).filter(w => w.length > 0);
  const condiciones = palabras.map(w => Prisma.sql`unaccent(lower(nombre_completo)) LIKE unaccent(lower(${`%${w}%`}))`);
  return prisma.$queryRaw`
    SELECT id, nombre_completo AS "nombreCompleto", dpi, telefono,
           fecha_nacimiento AS "fechaNacimiento", sexo
    FROM paciente
    WHERE activo = true
      AND ${Prisma.join(condiciones, ' AND ')}
    ORDER BY nombre_completo
    LIMIT 20
  `;
}

// POST /api/pacientes — RF-07 + RF-08
async function crear(datos, { usuarioId, ip, userAgent }) {
  datos.fechaNacimiento = new Date(datos.fechaNacimiento);

  const existe = await prisma.paciente.findUnique({ where: { dpi: datos.dpi } });
  if (existe) {
    const err = new Error('Ya existe un paciente con ese DPI');
    err.code = 'DPI_DUPLICATE';
    err.status = 409;
    throw err;
  }

  const { paciente, expediente } = await prisma.$transaction(async (tx) => {
    const p = await tx.paciente.create({
      data: { ...datos, creadoPorId: usuarioId },
    });
    const e = await tx.expediente.create({
      data: { pacienteId: p.id, creadoPorId: usuarioId },
    });
    await registrarAuditoria(tx, {
      usuarioId,
      accion: 'INSERT',
      tablaAfectada: 'paciente',
      registroId: p.id,
      datosNuevos: { nombreCompleto: p.nombreCompleto, dpi: p.dpi },
      ip,
      userAgent,
    });
    return { paciente: p, expediente: e };
  });

  return { ...paciente, expedienteId: expediente.id };
}

// GET /api/pacientes/:id
async function obtener(id) {
  const paciente = await prisma.paciente.findUnique({
    where: { id },
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
    const err = new Error('Paciente no encontrado');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return paciente;
}

// PATCH /api/pacientes/:id
async function editar(id, datos, { usuarioId, ip, userAgent }) {
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) {
    const err = new Error('Paciente no encontrado');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const p = await tx.paciente.update({ where: { id }, data: datos });
    await registrarAuditoria(tx, {
      usuarioId,
      accion: 'UPDATE',
      tablaAfectada: 'paciente',
      registroId: p.id,
      datosAnteriores: { telefono: paciente.telefono, correo: paciente.correo },
      datosNuevos: datos,
      ip,
      userAgent,
    });
    return p;
  });
}

module.exports = { buscar, crear, obtener, editar };
