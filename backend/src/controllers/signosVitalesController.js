'use strict';

const prisma = require('../utils/prismaClient');
const errorResponse = require('../utils/errorResponse');
const registrarAuditoria = require('../utils/auditoria');
const { crearSignosVitalesSchema } = require('../validators/signosVitales');

// POST /api/signos-vitales — RF-11 (enfermera o médico)
async function crear(req, res, next) {
  try {
    const parsed = crearSignosVitalesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const datos = parsed.data;

    // Verificar que la cita existe
    const cita = await prisma.cita.findUnique({
      where: { id: datos.citaId },
      select: { id: true, estado: true },
    });
    if (!cita) {
      return res.status(404).json(errorResponse('Cita no encontrada', 'NOT_FOUND'));
    }

    // Un solo registro por cita (unique en schema)
    const existente = await prisma.signosVitales.findUnique({ where: { citaId: datos.citaId } });
    if (existente) {
      return res.status(409).json(errorResponse('Esta cita ya tiene signos vitales registrados', 'SIGNOS_DUPLICATE'));
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const signos = await prisma.$transaction(async (tx) => {
      const s = await tx.signosVitales.create({
        data: { ...datos, enfermeraId: req.user.id },
      });

      await registrarAuditoria(tx, {
        usuarioId: req.user.id,
        accion: 'INSERT',
        tablaAfectada: 'signos_vitales',
        registroId: s.id,
        datosNuevos: { citaId: datos.citaId },
        ip,
        userAgent: req.headers['user-agent'],
      });

      return s;
    });

    return res.status(201).json(signos);
  } catch (err) {
    next(err);
  }
}

module.exports = { crear };
