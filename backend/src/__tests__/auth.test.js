'use strict';

/**
 * Pruebas Sprint 1-2: autenticación
 *
 * Requieren base de datos real (PostgreSQL con seed de usuario admin).
 * Correr con: npm test
 *
 * Variables necesarias en .env.test:
 *   DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Carga variables de entorno de prueba antes de importar la app
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_32_caracteres_minimo!!';
process.env.JWT_EXPIRES_IN = '1m';

const app = require('../app');

describe('POST /api/auth/login', () => {
  test('retorna 401 con credenciales inválidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe(true);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('retorna 422 si el email tiene formato incorrecto', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noesvalido', password: 'pass123' });

    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('retorna 422 si falta la contraseña', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinica.gt' });

    expect(res.statusCode).toBe(422);
  });
});

describe('GET /api/usuarios — control de acceso por rol', () => {
  test('retorna 401 sin token', async () => {
    const res = await request(app).get('/api/usuarios');
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  test('retorna 403 cuando rol es secretaria (RF-02/RN)', async () => {
    const token = jwt.sign(
      { id: 'fake-uuid', rol: 'secretaria', email: 'sec@test.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1m' }
    );

    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});

describe('authMiddleware — token expirado', () => {
  test('retorna 401 con código INVALID_TOKEN cuando el token expiró', async () => {
    // Token ya expirado (expiresIn: 0)
    const token = jwt.sign(
      { id: 'fake-uuid', rol: 'administrador' },
      process.env.JWT_SECRET,
      { expiresIn: 0 }
    );

    // Pequeña espera para asegurar expiración
    await new Promise((r) => setTimeout(r, 10));

    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });
});
