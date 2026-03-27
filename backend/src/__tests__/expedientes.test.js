'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_32_caracteres_minimo!!';
process.env.JWT_EXPIRES_IN = '1m';

const app = require('../app');

function tokenPara(rol) {
  return jwt.sign({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', rol, email: `${rol}@test.com` }, process.env.JWT_SECRET, { expiresIn: '1m' });
}

describe('RN-03 — Expedientes no se eliminan', () => {
  test('DELETE /api/expedientes/:id retorna 405 Method Not Allowed', async () => {
    const res = await request(app)
      .delete('/api/expedientes/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .set('Authorization', `Bearer ${tokenPara('administrador')}`);

    expect(res.statusCode).toBe(405);
    expect(res.body.code).toBe('METHOD_NOT_ALLOWED');
  });
});

describe('RN-02 — Solo médico puede registrar consultas', () => {
  test('POST /api/consultas con rol enfermera retorna 403', async () => {
    const res = await request(app)
      .post('/api/consultas')
      .set('Authorization', `Bearer ${tokenPara('enfermera')}`)
      .send({ expedienteId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', motivoConsulta: 'Test' });

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('POST /api/consultas con rol secretaria retorna 403', async () => {
    const res = await request(app)
      .post('/api/consultas')
      .set('Authorization', `Bearer ${tokenPara('secretaria')}`)
      .send({ expedienteId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', motivoConsulta: 'Test' });

    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/pacientes — búsqueda', () => {
  test('retorna array vacío si q tiene menos de 2 caracteres', async () => {
    const res = await request(app)
      .get('/api/pacientes?q=a')
      .set('Authorization', `Bearer ${tokenPara('medico')}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  test('retorna 401 sin token', async () => {
    const res = await request(app).get('/api/pacientes?q=garcia');
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/pacientes — validación', () => {
  test('retorna 422 si falta DPI', async () => {
    const res = await request(app)
      .post('/api/pacientes')
      .set('Authorization', `Bearer ${tokenPara('secretaria')}`)
      .send({ nombreCompleto: 'Test Paciente', sexo: 'masculino', telefono: '12345678', fechaNacimiento: '1990-01-01' });

    expect(res.statusCode).toBe(422);
  });

  test('retorna 422 si DPI tiene letras', async () => {
    const res = await request(app)
      .post('/api/pacientes')
      .set('Authorization', `Bearer ${tokenPara('secretaria')}`)
      .send({ nombreCompleto: 'Test', dpi: 'ABC123456789', sexo: 'masculino', telefono: '12345678', fechaNacimiento: '1990-01-01' });

    expect(res.statusCode).toBe(422);
  });
});
