'use strict';
const prisma = require('../utils/prismaClient');

function parseFecha(str, fallback) {
  const d = str ? new Date(str) : fallback;
  return isNaN(d) ? fallback : d;
}

function inicioDelDia(d) {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}

function finDelDia(d) {
  const r = new Date(d); r.setHours(23, 59, 59, 999); return r;
}

// RF-33 — datos de citas
async function obtenerDatosCitas({ desde: desdeStr, hasta: hastaStr, medicoId, estado }) {
  const hoy   = new Date();
  const desde = inicioDelDia(parseFecha(desdeStr, new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const hasta = finDelDia(parseFecha(hastaStr, hoy));

  const where = {
    fechaHoraInicio: { gte: desde, lte: hasta },
    ...(medicoId && { medicoId }),
    ...(estado   && { estado }),
  };

  const citas = await prisma.cita.findMany({
    where,
    orderBy: { fechaHoraInicio: 'asc' },
    select: {
      id: true,
      fechaHoraInicio: true,
      fechaHoraFin: true,
      estado: true,
      tipoConsulta: { select: { nombre: true } },
      paciente: { select: { nombreCompleto: true } },
      medico:   { select: { nombreCompleto: true } },
      motivoCancelacion: true,
    },
  });

  const resumen = citas.reduce((acc, c) => {
    acc[c.estado] = (acc[c.estado] || 0) + 1;
    return acc;
  }, {});

  return { desde, hasta, total: citas.length, resumen, citas };
}

// RF-34 — datos de pacientes atendidos
async function obtenerDatosPacientes({ desde: desdeStr, hasta: hastaStr, medicoId }) {
  const hoy   = new Date();
  const desde = inicioDelDia(parseFecha(desdeStr, new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const hasta = finDelDia(parseFecha(hastaStr, hoy));

  const consultas = await prisma.consulta.findMany({
    where: {
      fechaHora: { gte: desde, lte: hasta },
      ...(medicoId && { medicoId }),
    },
    orderBy: { fechaHora: 'asc' },
    select: {
      id: true,
      fechaHora: true,
      motivoConsulta: true,
      diagnosticoCie10: true,
      esEmergencia: true,
      medico: { select: { nombreCompleto: true } },
      expediente: {
        select: {
          paciente: { select: { nombreCompleto: true, fechaNacimiento: true, sexo: true } },
        },
      },
    },
  });

  const porMedico = consultas.reduce((acc, c) => {
    const nombre = c.medico?.nombreCompleto ?? 'Sin médico';
    if (!acc[nombre]) acc[nombre] = 0;
    acc[nombre]++;
    return acc;
  }, {});

  return { desde, hasta, total: consultas.length, porMedico, consultas };
}

module.exports = { obtenerDatosCitas, obtenerDatosPacientes };
