'use strict';

const nodemailer = require('nodemailer');

function crearTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  const port = parseInt(SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
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
      from: process.env.SMTP_FROM || `"Clínica" <${process.env.SMTP_USER}>`,
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

/**
 * Envía email de restablecimiento de contraseña.
 * Si SMTP no está configurado, omite silenciosamente.
 */
async function enviarResetPassword({ correo, nombreUsuario, linkReset }) {
  const transporter = crearTransporter();
  if (!transporter || !correo) return;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Clínica" <${process.env.SMTP_USER}>`,
      to: correo,
      subject: 'Restablecimiento de contraseña',
      text: [
        `Estimado/a ${nombreUsuario},`,
        '',
        'Recibimos una solicitud para restablecer la contraseña de su cuenta.',
        '',
        'Acceda al siguiente enlace para crear una nueva contraseña:',
        '',
        linkReset,
        '',
        'Este enlace es válido por 15 minutos. Si no solicitó este cambio, ignore este correo.',
        '',
        'Atentamente,',
        'Clínica Médica',
      ].join('\n'),
    });
  } catch (err) {
    console.error('[email] Error al enviar reset de contraseña:', err.message);
  }
}

module.exports = { enviarConfirmacionCita, enviarResetPassword };
