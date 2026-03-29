'use strict';
const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/requireRole');
const c    = require('../controllers/reportesController');

const router = Router();
const adminMedico = role(['administrador', 'medico']);

router.get('/citas',          auth, adminMedico, c.reporteCitas);
router.get('/citas/pdf',      auth, adminMedico, c.reporteCitasPDF);
router.get('/pacientes',      auth, adminMedico, c.reportePacientes);
router.get('/pacientes/pdf',  auth, adminMedico, c.reportePacientesPDF);

module.exports = router;
