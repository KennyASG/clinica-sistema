'use strict';

const { Resend } = require('resend');

function crearCliente() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.EMAIL_FROM || 'Clínica Médica <no-reply@clinica.kdevsa.online>';

/**
 * Envía email de confirmación de cita.
 * Si RESEND_API_KEY no está configurado, omite silenciosamente.
 */
async function enviarConfirmacionCita({ correo, nombrePaciente, medico, fecha, tipo }) {
  const resend = crearCliente();
  if (!resend || !correo) return;

  const fechaFormateada = new Date(fecha).toLocaleString('es-GT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  try {
    await resend.emails.send({
      from: FROM(),
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
      ].filter(Boolean).join('\n'),
    });
  } catch (err) {
    console.error('[email] Error al enviar confirmación:', err.message);
  }
}

/**
 * Envía email de restablecimiento de contraseña.
 * Si RESEND_API_KEY no está configurado, omite silenciosamente.
 */
async function enviarResetPassword({ correo, nombreUsuario, linkReset }) {
  const resend = crearCliente();
  if (!resend || !correo) return;

  try {
    await resend.emails.send({
      from: FROM(),
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
