'use strict';

const prisma = require('../utils/prismaClient');

// ── Helpers ────────────────────────────────────────────────────
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

// ── RF-33  GET /api/reportes/citas ─────────────────────────────
async function reporteCitas(req, res, next) {
  try {
    const hoy = new Date();
    const desde  = inicioDelDia(parseFecha(req.query.desde, new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
    const hasta  = finDelDia(parseFecha(req.query.hasta, hoy));
    const { medicoId, estado } = req.query;

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

    // Resumen agregado
    const resumen = citas.reduce((acc, c) => {
      acc[c.estado] = (acc[c.estado] || 0) + 1;
      return acc;
    }, {});

    return res.json({ desde, hasta, total: citas.length, resumen, citas });
  } catch (err) {
    next(err);
  }
}

// ── RF-34  GET /api/reportes/pacientes ─────────────────────────
async function reportePacientes(req, res, next) {
  try {
    const hoy = new Date();
    const desde  = inicioDelDia(parseFecha(req.query.desde, new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
    const hasta  = finDelDia(parseFecha(req.query.hasta, hoy));
    const { medicoId } = req.query;

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

    // Agrupar por médico
    const porMedico = consultas.reduce((acc, c) => {
      const nombre = c.medico?.nombreCompleto ?? 'Sin médico';
      if (!acc[nombre]) acc[nombre] = 0;
      acc[nombre]++;
      return acc;
    }, {});

    return res.json({ desde, hasta, total: consultas.length, porMedico, consultas });
  } catch (err) {
    next(err);
  }
}

// ── RF-36  GET /api/reportes/citas/pdf ─────────────────────────
async function reporteCitasPDF(req, res, next) {
  try {
    const PDFDocument = require('pdfkit');
    const hoy = new Date();
    const desde = inicioDelDia(parseFecha(req.query.desde, new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
    const hasta  = finDelDia(parseFecha(req.query.hasta, hoy));
    const { medicoId, estado } = req.query;

    const where = {
      fechaHoraInicio: { gte: desde, lte: hasta },
      ...(medicoId && { medicoId }),
      ...(estado   && { estado }),
    };

    const citas = await prisma.cita.findMany({
      where,
      orderBy: { fechaHoraInicio: 'asc' },
      select: {
        fechaHoraInicio: true,
        estado: true,
        tipoConsulta: { select: { nombre: true } },
        paciente: { select: { nombreCompleto: true } },
        medico:   { select: { nombreCompleto: true } },
      },
    });

    const fmtFecha = d => new Date(d).toLocaleDateString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const doc = new PDFDocument({ margin: 50, size: 'letter' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-citas-${desde.toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    // Encabezado
    doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Citas', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(
      `Período: ${desde.toLocaleDateString('es-GT')} — ${hasta.toLocaleDateString('es-GT')}`,
      { align: 'center' },
    );
    doc.moveDown();
    doc.fontSize(10).text(`Total: ${citas.length} citas`, { continued: true });
    doc.moveDown(1.5);

    // Cabecera de tabla
    const cols = [50, 170, 260, 360, 460];
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Fecha/Hora', cols[0], doc.y, { width: 110 });
    doc.text('Paciente',   cols[1], doc.y - doc.currentLineHeight(), { width: 85 });
    doc.text('Médico',     cols[2], doc.y - doc.currentLineHeight(), { width: 95 });
    doc.text('Tipo',       cols[3], doc.y - doc.currentLineHeight(), { width: 95 });
    doc.text('Estado',     cols[4], doc.y - doc.currentLineHeight(), { width: 80 });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    // Filas
    doc.font('Helvetica').fontSize(8);
    citas.forEach(c => {
      const y = doc.y;
      if (y > 700) { doc.addPage(); }
      doc.text(fmtFecha(c.fechaHoraInicio), cols[0], doc.y, { width: 110 });
      doc.text(c.paciente?.nombreCompleto ?? '—', cols[1], doc.y - doc.currentLineHeight(), { width: 85 });
      doc.text(c.medico?.nombreCompleto ?? '—',   cols[2], doc.y - doc.currentLineHeight(), { width: 95 });
      doc.text(c.tipoConsulta?.nombre ?? '—',     cols[3], doc.y - doc.currentLineHeight(), { width: 95 });
      doc.text(c.estado,                          cols[4], doc.y - doc.currentLineHeight(), { width: 80 });
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

// ── RF-36  GET /api/reportes/pacientes/pdf ─────────────────────
async function reportePacientesPDF(req, res, next) {
  try {
    const PDFDocument = require('pdfkit');
    const hoy = new Date();
    const desde = inicioDelDia(parseFecha(req.query.desde, new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
    const hasta  = finDelDia(parseFecha(req.query.hasta, hoy));
    const { medicoId } = req.query;

    const consultas = await prisma.consulta.findMany({
      where: {
        fechaHora: { gte: desde, lte: hasta },
        ...(medicoId && { medicoId }),
      },
      orderBy: { fechaHora: 'asc' },
      select: {
        fechaHora: true,
        motivoConsulta: true,
        diagnosticoCie10: true,
        esEmergencia: true,
        medico: { select: { nombreCompleto: true } },
        expediente: {
          select: {
            paciente: { select: { nombreCompleto: true } },
          },
        },
      },
    });

    const fmtFecha = d => new Date(d).toLocaleDateString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    const doc = new PDFDocument({ margin: 50, size: 'letter' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-pacientes-${desde.toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Pacientes Atendidos', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(
      `Período: ${desde.toLocaleDateString('es-GT')} — ${hasta.toLocaleDateString('es-GT')}`,
      { align: 'center' },
    );
    doc.moveDown();
    doc.text(`Total consultas: ${consultas.length}`);
    doc.moveDown(1.5);

    const cols = [50, 140, 250, 360, 460];
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Fecha',    cols[0], doc.y, { width: 80 });
    doc.text('Paciente', cols[1], doc.y - doc.currentLineHeight(), { width: 105 });
    doc.text('Médico',   cols[2], doc.y - doc.currentLineHeight(), { width: 105 });
    doc.text('Motivo',   cols[3], doc.y - doc.currentLineHeight(), { width: 95 });
    doc.text('CIE-10',   cols[4], doc.y - doc.currentLineHeight(), { width: 80 });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(8);
    consultas.forEach(c => {
      if (doc.y > 700) { doc.addPage(); }
      doc.text(fmtFecha(c.fechaHora),                            cols[0], doc.y, { width: 80 });
      doc.text(c.expediente?.paciente?.nombreCompleto ?? '—',    cols[1], doc.y - doc.currentLineHeight(), { width: 105 });
      doc.text(c.medico?.nombreCompleto ?? '—',                  cols[2], doc.y - doc.currentLineHeight(), { width: 105 });
      doc.text(c.motivoConsulta,                                 cols[3], doc.y - doc.currentLineHeight(), { width: 95 });
      doc.text(c.diagnosticoCie10 ?? '—',                        cols[4], doc.y - doc.currentLineHeight(), { width: 80 });
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { reporteCitas, reportePacientes, reporteCitasPDF, reportePacientesPDF };
