'use strict';

const prisma = require('../utils/prismaClient');
const errorResponse = require('../utils/errorResponse');
const registrarAuditoria = require('../utils/auditoria');
const { editarExpedienteSchema } = require('../validators/expedientes');

// GET /api/expedientes/:id
async function obtener(req, res, next) {
  try {
    const expediente = await prisma.expediente.findUnique({
      where: { id: req.params.id },
      include: {
        paciente: {
          select: {
            id: true, nombreCompleto: true, dpi: true,
            fechaNacimiento: true, sexo: true, telefono: true,
            telefonoEmergencia: true, contactoEmergencia: true,
            correo: true, activo: true,
          },
        },
      },
    });

    if (!expediente) {
      return res.status(404).json(errorResponse('Expediente no encontrado', 'NOT_FOUND'));
    }

    return res.json(expediente);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/expedientes/:id — RF-12 (RN-03: solo activo=false, nunca DELETE)
async function editar(req, res, next) {
  try {
    const parsed = editarExpedienteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json(errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR'));
    }
    const datos = parsed.data;

    const expediente = await prisma.expediente.findUnique({ where: { id: req.params.id } });
    if (!expediente) {
      return res.status(404).json(errorResponse('Expediente no encontrado', 'NOT_FOUND'));
    }

    // Sincroniza flag tiene_alergias cuando se actualiza el campo alergias (RF-15)
    if ('alergias' in datos) {
      datos.tieneAlergias = !!(datos.alergias && datos.alergias.trim().length > 0);
    }

    datos.actualizadoPorId = req.user.id;

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const actualizado = await prisma.$transaction(async (tx) => {
      const e = await tx.expediente.update({
        where: { id: req.params.id },
        data: datos,
      });

      await registrarAuditoria(tx, {
        usuarioId: req.user.id,
        accion: 'UPDATE',
        tablaAfectada: 'expediente',
        registroId: e.id,
        datosAnteriores: { tieneAlergias: expediente.tieneAlergias, activo: expediente.activo },
        datosNuevos: { tieneAlergias: e.tieneAlergias, activo: e.activo },
        ip,
        userAgent: req.headers['user-agent'],
      });

      return e;
    });

    return res.json(actualizado);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/expedientes/:id — RN-03: SIEMPRE 405
function metodNoPermitido(_req, res) {
  return res.status(405).json(
    errorResponse('Los expedientes no pueden eliminarse. Use PATCH activo:false', 'METHOD_NOT_ALLOWED')
  );
}

// GET /api/expedientes/:id/historial — RF-14 (más reciente primero)
async function historial(req, res, next) {
  try {
    const expediente = await prisma.expediente.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!expediente) {
      return res.status(404).json(errorResponse('Expediente no encontrado', 'NOT_FOUND'));
    }

    const consultas = await prisma.consulta.findMany({
      where: { expedienteId: req.params.id },
      include: {
        medico: {
          select: { id: true, nombreCompleto: true, rol: true },
        },
        cita: {
          include: {
            signosVitales: {
              select: {
                presionArterial: true, temperaturaC: true, pesoKg: true,
                tallaCm: true, frecuenciaCardiaca: true, saturacionO2: true,
              },
            },
          },
        },
      },
      orderBy: { fechaHora: 'desc' },
    });

    return res.json(consultas);
  } catch (err) {
    next(err);
  }
}

module.exports = { obtener, editar, metodNoPermitido, historial };
