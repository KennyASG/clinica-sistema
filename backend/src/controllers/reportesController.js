'use strict';
const PDFDocument = require('pdfkit');
const svc = require('../services/reportesService');

// ── RF-33  GET /api/reportes/citas ─────────────────────────────
async function reporteCitas(req, res, next) {
  try {
    const datos = await svc.obtenerDatosCitas(req.query);
    return res.json(datos);
  } catch (err) {
    next(err);
  }
}

// ── RF-34  GET /api/reportes/pacientes ─────────────────────────
async function reportePacientes(req, res, next) {
  try {
    const datos = await svc.obtenerDatosPacientes(req.query);
    return res.json(datos);
  } catch (err) {
    next(err);
  }
}

// ── RF-36  GET /api/reportes/citas/pdf ─────────────────────────
async function reporteCitasPDF(req, res, next) {
  try {
    const { desde, hasta, citas } = await svc.obtenerDatosCitas(req.query);

    const fmtFecha = d => new Date(d).toLocaleDateString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const doc = new PDFDocument({ margin: 50, size: 'letter' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-citas-${desde.toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Citas', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(
      `Período: ${desde.toLocaleDateString('es-GT')} — ${hasta.toLocaleDateString('es-GT')}`,
      { align: 'center' },
    );
    doc.moveDown();
    doc.fontSize(10).text(`Total: ${citas.length} citas`, { continued: true });
    doc.moveDown(1.5);

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

    doc.font('Helvetica').fontSize(8);
    citas.forEach(c => {
      if (doc.y > 700) { doc.addPage(); }
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
    const { desde, hasta, consultas } = await svc.obtenerDatosPacientes(req.query);

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
