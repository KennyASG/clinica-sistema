'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Seguridad y parsing
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});

// RF-26 — Bloquea escritura desde app móvil
app.use(require('./middlewares/readOnlyMobile'));

// Rutas API
app.use('/api', require('./routes/index'));

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ error: true, message: 'Ruta no encontrada', code: 'NOT_FOUND' });
});

// Manejo global de errores
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// Solo arranca el servidor si este archivo es el punto de entrada directo.
// Cuando jest/supertest importa app.js, no levanta el puerto.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

module.exports = app;
