'use strict';

// GET /api/medicos — Lista médicos activos para formularios (cualquier rol autenticado)
const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const prisma = require('../utils/prismaClient');

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req, res, next) => {
  try {
    const medicos = await prisma.usuario.findMany({
      where: { rol: 'medico', activo: true },
      select: { id: true, nombreCompleto: true, numeroColegiado: true },
      orderBy: { nombreCompleto: 'asc' },
    });
    return res.json(medicos);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
