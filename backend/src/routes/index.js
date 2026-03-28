'use strict';

const { Router } = require('express');

const router = Router();

router.use('/auth',          require('./auth'));
router.use('/usuarios',      require('./usuarios'));
router.use('/pacientes',     require('./pacientes'));
router.use('/expedientes',   require('./expedientes'));
router.use('/consultas',      require('./consultas'));
router.use('/signos-vitales', require('./signos-vitales'));
router.use('/citas',          require('./citas'));
router.use('/tipo-consultas', require('./tipo-consultas'));
router.use('/medicos',        require('./medicos'));
router.use('/especialidades', require('./especialidades'));

module.exports = router;
