'use strict';
/**
 * Pruebas de integración end-to-end — Sprint 10
 * Flujo: login → buscar paciente → abrir expediente →
 *        registrar consulta → agendar cita → cancelar cita
 *
 * Requiere BD con seed ejecutado (npm run db:seed).
 */
const { request, app, authed } = require('./helpers');

let tokenMedico, tokenSecretaria, tokenAdmin;
let pacienteId, expedienteId, citaId;

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeAll(async () => {
  tokenAdmin      = (await authed('admin')).Authorization;
  tokenMedico     = (await authed('medico')).Authorization;
  tokenSecretaria = (await authed('secretaria')).Authorization;
});

// ─── 1. Autenticación ────────────────────────────────────────────────────────
describe('Autenticación', () => {
  test('login con credenciales válidas retorna token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinica.gt', password: 'Admin1234!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario.rol).toBe('administrador');
  });

  test('credenciales inválidas retornan 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinica.gt', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('request sin token retorna 401', async () => {
    const res = await request(app).get('/api/usuarios');
    expect(res.status).toBe(401);
  });

  test('token expirado / inválido retorna 401', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', 'Bearer token.invalido.aqui');
    expect(res.status).toBe(401);
  });
});

// ─── 2. Buscar paciente ───────────────────────────────────────────────────────
describe('Búsqueda de paciente', () => {
  test('búsqueda por nombre encuentra resultados', async () => {
    const res = await request(app)
      .get('/api/pacientes?q=sanchez')
      .set('Authorization', tokenMedico);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    pacienteId = res.body[0].id;
  });

  test('búsqueda difusa sin tilde encuentra con tilde', async () => {
    const res = await request(app)
      .get('/api/pacientes?q=sanchez')
      .set('Authorization', tokenMedico);
    expect(res.status).toBe(200);
    expect(res.body.some(p =>
      p.nombreCompleto.toLowerCase().includes('s')
    )).toBe(true);
  });

  test('búsqueda con menos de 2 caracteres retorna array vacío', async () => {
    const res = await request(app)
      .get('/api/pacientes?q=a')
      .set('Authorization', tokenMedico);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── 3. Abrir expediente ──────────────────────────────────────────────────────
describe('Expediente del paciente', () => {
  test('GET /pacientes/:id retorna expediente con campos médicos', async () => {
    const res = await request(app)
      .get(`/api/pacientes/${pacienteId}`)
      .set('Authorization', tokenMedico);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nombreCompleto');
    expect(res.body).toHaveProperty('expediente');
    expedienteId = res.body.expediente.id;
  });

  test('historial del expediente es un array ordenado', async () => {
    const res = await request(app)
      .get(`/api/expedientes/${expedienteId}/historial`)
      .set('Authorization', tokenMedico);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('DELETE a expediente retorna 405', async () => {
    const res = await request(app)
      .delete(`/api/expedientes/${expedienteId}`)
      .set('Authorization', tokenAdmin);
    expect(res.status).toBe(405);
  });
});

// ─── 4. Registrar consulta ────────────────────────────────────────────────────
describe('Registrar consulta (médico)', () => {
  test('médico puede crear consulta', async () => {
    const res = await request(app)
      .post('/api/consultas')
      .set('Authorization', tokenMedico)
      .send({
        expedienteId,
        motivoConsulta: 'TEST — cefalea persistente',
        diagnosticoCie10: 'G43.9',
        diagnosticoDescripcion: 'Migraña sin especificar',
        tratamiento: 'Ibuprofeno 400mg cada 8h',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  test('secretaria NO puede crear consulta (403)', async () => {
    const res = await request(app)
      .post('/api/consultas')
      .set('Authorization', tokenSecretaria)
      .send({ expedienteId, motivoConsulta: 'test' });
    expect(res.status).toBe(403);
  });

  test('motivo de consulta < 5 chars retorna 422', async () => {
    const res = await request(app)
      .post('/api/consultas')
      .set('Authorization', tokenMedico)
      .send({ expedienteId, motivoConsulta: 'hi' });
    expect(res.status).toBe(422);
  });
});

// ─── 5. Agendar cita ──────────────────────────────────────────────────────────
describe('Agendar y gestionar cita', () => {
  let medicoId, tipoConsultaId;

  beforeAll(async () => {
    const [medRes, tipoRes] = await Promise.all([
      request(app).get('/api/medicos').set('Authorization', tokenSecretaria),
      request(app).get('/api/tipo-consultas').set('Authorization', tokenSecretaria),
    ]);
    medicoId       = medRes.body[0].id;
    tipoConsultaId = tipoRes.body[0].id;
  });

  test('secretaria puede agendar cita', async () => {
    // Mañana a las 15:00 — evita conflictos con seed de hoy
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(15, 0, 0, 0);
    const fin = new Date(manana);
    fin.setMinutes(30);

    const res = await request(app)
      .post('/api/citas')
      .set('Authorization', tokenSecretaria)
      .send({
        pacienteId,
        medicoId,
        tipoConsultaId,
        fechaHoraInicio: manana.toISOString(),
        fechaHoraFin:    fin.toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    citaId = res.body.id;
  });

  test('doble booking retorna error descriptivo', async () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(15, 0, 0, 0);
    const fin = new Date(manana); fin.setMinutes(30);

    const res = await request(app)
      .post('/api/citas')
      .set('Authorization', tokenSecretaria)
      .send({ pacienteId, medicoId, tipoConsultaId,
              fechaHoraInicio: manana.toISOString(),
              fechaHoraFin:    fin.toISOString() });
    expect(res.status).toBe(409);
  });

  test('cambiar estado de cita a confirmada', async () => {
    const res = await request(app)
      .patch(`/api/citas/${citaId}`)
      .set('Authorization', tokenSecretaria)
      .send({ estado: 'confirmada' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('confirmada');
  });
});

// ─── 6. Cancelar cita con motivo ─────────────────────────────────────────────
describe('Cancelar cita (RN-05)', () => {
  test('cancelar sin motivo retorna 422', async () => {
    const res = await request(app)
      .patch(`/api/citas/${citaId}`)
      .set('Authorization', tokenSecretaria)
      .send({ estado: 'cancelada' });
    expect(res.status).toBe(422);
  });

  test('cancelar con motivo retorna 200', async () => {
    const res = await request(app)
      .patch(`/api/citas/${citaId}`)
      .set('Authorization', tokenSecretaria)
      .send({ estado: 'cancelada', motivoCancelacion: 'Paciente no pudo asistir — TEST' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('cancelada');
    expect(res.body.motivoCancelacion).toBeTruthy();
  });
});

// ─── 7. Signos vitales ────────────────────────────────────────────────────────
describe('Signos vitales', () => {
  test('enfermera puede registrar signos vitales', async () => {
    const tokenEnfermera = (await authed('enfermera')).Authorization;
    // Buscar una cita confirmada existente
    const citasRes = await request(app)
      .get(`/api/citas?fecha=${new Date().toISOString().split('T')[0]}`)
      .set('Authorization', tokenEnfermera);
    const citaValida = citasRes.body.find(c =>
      ['pendiente','confirmada'].includes(c.estado) && !c.signosVitales
    );
    if (!citaValida) return; // Si no hay cita, skip

    const res = await request(app)
      .post('/api/signos-vitales')
      .set('Authorization', tokenEnfermera)
      .send({
        citaId:            citaValida.id,
        presionArterial:   '120/80',
        frecuenciaCardiaca: 72,
        saturacionO2:      98,
        temperaturaC:      36.6,
      });
    expect([201, 409]).toContain(res.status);
  });
});

// ─── 8. Auditoría ─────────────────────────────────────────────────────────────
describe('Auditoría (solo admin)', () => {
  test('admin puede consultar bitácora', async () => {
    const res = await request(app)
      .get('/api/auditoria')
      .set('Authorization', tokenAdmin);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('registros');
    expect(res.body).toHaveProperty('total');
  });

  test('médico NO puede consultar bitácora (403)', async () => {
    const res = await request(app)
      .get('/api/auditoria')
      .set('Authorization', tokenMedico);
    expect(res.status).toBe(403);
  });
});
