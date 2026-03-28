'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const prisma = require('../utils/prismaClient');

const router = Router();
router.use(authMiddleware);

// GET /api/especialidades — catálogo para formularios
router.get('/', async (_req, res, next) => {
  try {
    const especialidades = await prisma.especialidad.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
    return res.json(especialidades);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
