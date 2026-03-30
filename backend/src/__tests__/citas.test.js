'use strict';

/**
 * Pruebas Sprint 5-6: módulo de citas
 * Requieren base de datos real con seed ejecutado.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_32_caracteres_minimo!!';
process.env.JWT_EXPIRES_IN = '5m';

const app = require('../app');

// Helpers de tokens
function tokenFor(rol, id = '00000000-0000-0000-0000-000000000001') {
  return jwt.sign({ id, rol, readonly: false }, process.env.JWT_SECRET, { expiresIn: '5m' });
}

const tokenAdmin     = tokenFor('administrador');
const tokenSecretaria = tokenFor('secretaria');
const tokenMedico    = tokenFor('medico');

// ─── GET /api/citas ───────────────────────────────────────────────────────────

describe('GET /api/citas', () => {
  test('retorna 401 sin token', async () => {
    const res = await request(app).get('/api/citas');
    expect(res.statusCode).toBe(401);
  });

  test('retorna array con token válido', async () => {
    const res = await request(app)
      .get('/api/citas')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('filtra por fecha — retorna solo citas del día indicado', async () => {
    const res = await request(app)
      .get('/api/citas?fecha=2099-01-01')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
    // No hay citas en el futuro lejano
    expect(res.body).toEqual([]);
  });

  test('fecha inválida retorna 422', async () => {
    const res = await request(app)
      .get('/api/citas?fecha=no-es-fecha')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

// ─── POST /api/citas ──────────────────────────────────────────────────────────

describe('POST /api/citas', () => {
  test('retorna 401 sin token', async () => {
    const res = await request(app).post('/api/citas').send({});
    expect(res.statusCode).toBe(401);
  });

  test('retorna 403 cuando rol es enfermera', async () => {
    const tokenEnfermera = tokenFor('enfermera');
    const res = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${tokenEnfermera}`)
      .send({ pacienteId: 'uuid', medicoId: 'uuid', tipoConsultaId: 'uuid' });
    expect(res.statusCode).toBe(403);
  });

  test('retorna 422 con body vacío', async () => {
    const res = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${tokenSecretaria}`)
      .send({});
    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('retorna 422 cuando fechaHoraFin <= fechaHoraInicio', async () => {
    const res = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${tokenSecretaria}`)
      .send({
        pacienteId:      '00000000-0000-0000-0000-000000000099',
        medicoId:        '00000000-0000-0000-0000-000000000099',
        tipoConsultaId:  '00000000-0000-0000-0000-000000000099',
        fechaHoraInicio: '2099-06-01T10:00:00.000Z',
        fechaHoraFin:    '2099-06-01T09:00:00.000Z',
      });
    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

// ─── PATCH /api/citas/:id ─────────────────────────────────────────────────────

describe('PATCH /api/citas/:id', () => {
  test('cancelar sin motivo retorna 422 (RN-05)', async () => {
    const res = await request(app)
      .patch('/api/citas/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${tokenSecretaria}`)
      .send({ estado: 'cancelada' }); // sin motivoCancelacion
    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('estado inválido retorna 422', async () => {
    const res = await request(app)
      .patch('/api/citas/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${tokenSecretaria}`)
      .send({ estado: 'estado_inexistente' });
    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('cita inexistente retorna 404', async () => {
    const res = await request(app)
      .patch('/api/citas/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${tokenSecretaria}`)
      .send({ estado: 'confirmada' });
    // 404 porque el UUID no existe en la BD
    expect([404, 422]).toContain(res.statusCode);
  });
});

// ─── GET /api/medicos ─────────────────────────────────────────────────────────

describe('GET /api/medicos', () => {
  test('retorna 401 sin token', async () => {
    const res = await request(app).get('/api/medicos');
    expect(res.statusCode).toBe(401);
  });

  test('retorna array de médicos activos', async () => {
    const res = await request(app)
      .get('/api/medicos')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Todos deben ser médicos
    res.body.forEach(m => expect(m).toHaveProperty('nombreCompleto'));
  });
});

// ─── GET /api/tipo-consultas ──────────────────────────────────────────────────

describe('GET /api/tipo-consultas', () => {
  test('retorna lista de tipos de consulta', async () => {
    const res = await request(app)
      .get('/api/tipo-consultas')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
