'use strict';
const { Router } = require('express');
const auth  = require('../middlewares/authMiddleware');
const role  = require('../middlewares/requireRole');
const prisma = require('../utils/prismaClient');

const router = Router();
router.use(auth);
const admin = role(['administrador']);

// GET /api/especialidades
router.get('/', async (_req, res, next) => {
  try {
    const especialidades = await prisma.especialidad.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, descripcion: true },
      orderBy: { nombre: 'asc' },
    });
    return res.json(especialidades);
  } catch (err) { next(err); }
});

// POST /api/especialidades
router.post('/', admin, async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const esp = await prisma.especialidad.create({ data: { nombre, descripcion } });
    return res.status(201).json(esp);
  } catch (err) { next(err); }
});

// PATCH /api/especialidades/:id
router.patch('/:id', admin, async (req, res, next) => {
  try {
    const { nombre, descripcion, activo } = req.body;
    const esp = await prisma.especialidad.update({
      where: { id: req.params.id },
      data: {
        ...(nombre      !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(activo      !== undefined && { activo }),
      },
    });
    return res.json(esp);
  } catch (err) { next(err); }
});

// DELETE /api/especialidades/:id  (soft)
router.delete('/:id', admin, async (req, res, next) => {
  try {
    await prisma.especialidad.update({ where: { id: req.params.id }, data: { activo: false } });
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
