'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Seguridad y parsing
app.use(helmet({
  // Strict-Transport-Security: max-age=31536000; includeSubDomains
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // X-Frame-Options: SAMEORIGIN
  frameguard: { action: 'sameorigin' },
  // X-Content-Type-Options: nosniff
  noSniff: true,
  // Referrer-Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Content-Security-Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: { allow: false },
  // X-Download-Options
  ieNoOpen: true,
  // X-XSS-Protection (legacy browsers)
  xssFilter: true,
}));

// Permissions-Policy (no incluido en Helmet, se agrega manualmente)
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
  next();
});

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});

// Swagger UI — solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi   = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');

  // Relajar CSP solo para la ruta de docs
  app.use('/api/docs', (_req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
    next();
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Clínica API Docs',
  }));
  console.log('Swagger disponible en http://localhost:3000/api/docs');
}

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
