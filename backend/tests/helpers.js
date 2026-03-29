'use strict';
require('dotenv').config();
const request = require('supertest');
const app     = require('../src/app');

const CREDS = {
  admin:      { email: 'admin@clinica.gt',        password: 'Admin1234!' },
  medico:     { email: 'dr.garcia@clinica.gt',    password: 'Medico1234!' },
  enfermera:  { email: 'enfermera@clinica.gt',    password: 'Enfermera1234!' },
  secretaria: { email: 'secretaria@clinica.gt',   password: 'Secretaria1234!' },
};

const tokens = {};

async function getToken(rol) {
  if (tokens[rol]) return tokens[rol];
  const res = await request(app)
    .post('/api/auth/login')
    .send(CREDS[rol]);
  if (res.status !== 200) throw new Error(`Login ${rol} falló: ${res.status} ${JSON.stringify(res.body)}`);
  tokens[rol] = res.body.token;
  return tokens[rol];
}

function auth(rol) {
  return async () => `Bearer ${await getToken(rol)}`;
}

async function authed(rol) {
  return { Authorization: `Bearer ${await getToken(rol)}` };
}

module.exports = { request, app, getToken, auth, authed, CREDS };
