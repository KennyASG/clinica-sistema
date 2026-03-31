'use strict';
const { Router } = require('express');
const router = Router();

router.use('/auth',           require('./auth'));
router.use('/usuarios',       require('./usuarios'));
router.use('/pacientes',      require('./pacientes'));
router.use('/expedientes',    require('./expedientes'));
router.use('/consultas',      require('./consultas'));
router.use('/signos-vitales', require('./signos-vitales'));
router.use('/citas',          require('./citas'));
router.use('/tipo-consultas', require('./tipo-consultas'));
router.use('/medicos',        require('./medicos'));
router.use('/especialidades', require('./especialidades'));
router.use('/horarios',       require('./horarios'));
router.use('/reportes',       require('./reportes'));
router.use('/auditoria',      require('./auditoria'));

module.exports = router;
