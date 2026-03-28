'use strict';

const nodemailer = require('nodemailer');

function crearTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: parseInt(SMTP_PORT || '587') === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Envía email de confirmación de cita.
 * Si SMTP no está configurado, omite silenciosamente.
 */
async function enviarConfirmacionCita({ correo, nombrePaciente, medico, fecha, tipo }) {
  const transporter = crearTransporter();
  if (!transporter || !correo) return;

  const fechaFormateada = new Date(fecha).toLocaleString('es-GT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  try {
    await transporter.sendMail({
      from: `"Clínica" <${process.env.SMTP_USER}>`,
      to: correo,
      subject: 'Confirmación de cita médica',
      text: [
        `Estimado/a ${nombrePaciente},`,
        '',
        'Su cita ha sido agendada exitosamente.',
        '',
        `Médico:  ${medico}`,
        `Fecha:   ${fechaFormateada}`,
        tipo ? `Tipo:    ${tipo}` : '',
        '',
        'Si necesita cancelar o reprogramar su cita, comuníquese con la clínica.',
        '',
        'Atentamente,',
        'Clínica Médica',
      ].filter(l => l !== undefined).join('\n'),
    });
  } catch (err) {
    // Email no crítico — loguear pero no lanzar
    console.error('[email] Error al enviar confirmación:', err.message);
  }
}

module.exports = { enviarConfirmacionCita };
