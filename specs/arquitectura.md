# Arquitectura — Sistema de Gestión Clínica Médica

> Versión 1.0 | Autor: Kenny Sáenz | Última actualización: 2026-03-27

---

## Visión general

```
┌─────────────────┐     HTTPS      ┌─────────────────────────────────────┐
│   React Web     │ ──────────────▶│                                     │
│  (Vite + RQ)    │                │      DigitalOcean Droplet $12/mes   │
└─────────────────┘                │                                     │
                                   │  ┌───────────┐   ┌──────────────┐  │
┌─────────────────┐     HTTPS      │  │   Nginx   │──▶│  Express 5   │  │
│  React Native   │ ──────────────▶│  │ (reverse  │   │  (PM2)       │  │
│  (Expo)         │                │  │  proxy)   │   └──────┬───────┘  │
└─────────────────┘                │  └───────────┘          │           │
                                   │                  ┌───────▼───────┐  │
                                   │                  │  PostgreSQL 16│  │
                                   │                  └───────────────┘  │
                                   │                                     │
                                   │  ┌─────────────────────────────┐    │
                                   │  │  DigitalOcean Spaces (CDN)  │    │
                                   │  │  archivos adjuntos (10MB)   │    │
                                   │  └─────────────────────────────┘    │
                                   └─────────────────────────────────────┘
```

---

## Stack tecnológico

| Capa | Tecnología | Versión | Justificación |
|------|------------|---------|---------------|
| Backend | Node.js + Express | 20 LTS + v5 | Ecosistema maduro, Express 5 con async/await nativo |
| ORM | Prisma | v7 | Type-safety, migrations declarativas, Client generado |
| Auth | JWT + bcryptjs | jsonwebtoken v9 | Estándar industria; bcryptjs por compatibilidad pura JS |
| Validación | Zod | v4 | Schema-first, integra bien con TypeScript futuro |
| Seguridad | Helmet.js | v8 | Headers de seguridad HTTP con un import |
| Frontend | React + Vite | 19 + 6 | Build rápido, HMR, compatible con Tailwind v4 |
| Estilos | Tailwind CSS | v4 | Utility-first, sin CSS custom, consistencia de diseño |
| Data fetching | React Query | v5 | Cache, loading states, optimistic updates |
| Routing web | React Router | v7 | Estándar de facto React, file-based routing opcional |
| Móvil | React Native + Expo | 0.74 + SDK 51 | Shared codebase web/móvil, OTA updates con Expo |
| BD | PostgreSQL | 16 | JSONB para auditoría, pg_trgm para búsqueda difusa |
| Infra | DigitalOcean Droplet | $12/mes | Costo mínimo para clínica pequeña, suficiente para ~50 usuarios |
| Proceso | PM2 | v5 | Restart automático, logs, clustering opcional |
| Proxy | Nginx | latest | TLS termination, reverse proxy, archivos estáticos |
| TLS | Let's Encrypt | Certbot | Certificados gratuitos, renovación automática |
| Storage | DO Spaces | — | S3-compatible, CDN incluido, $5/mes extra |

---

## Estructura de la API REST

```
/api
├── /auth
│   └── POST   /login
├── /usuarios
│   ├── GET    /                    (admin)
│   ├── POST   /                    (admin)
│   └── PATCH  /:id                 (admin)
├── /pacientes
│   ├── GET    /?q=                 (búsqueda difusa)
│   ├── POST   /
│   └── GET    /:id
├── /expedientes
│   ├── GET    /:id
│   ├── PATCH  /:id
│   └── GET    /:id/historial
├── /consultas
│   └── POST   /                    (solo medico)
├── /signos-vitales
│   └── POST   /                    (enfermera, medico)
├── /documentos
│   └── POST   /                    (multipart/form-data)
├── /citas
│   ├── GET    /?medico=&fecha=
│   ├── POST   /
│   └── PATCH  /:id
├── /reportes
│   ├── GET    /citas
│   └── GET    /pacientes
└── /auditoria
    └── GET    /                    (solo admin)
```

---

## Flujo de autenticación

```
Cliente                    Backend                      BD
  │                           │                          │
  │── POST /api/auth/login ──▶│                          │
  │   { email, password }     │── SELECT usuario ───────▶│
  │                           │◀─ { hash, rol, activo } ─│
  │                           │                          │
  │                           │ bcrypt.compare()          │
  │                           │ jwt.sign({ id, rol })     │
  │                           │── INSERT auditoria ──────▶│
  │◀─ 200 { token } ──────────│                          │
  │                           │                          │
  │── GET /api/expedientes/:id │                          │
  │   Authorization: Bearer.. │                          │
  │                           │ authMiddleware            │
  │                           │ → jwt.verify()            │
  │                           │ requireRole(['medico'])   │
  │                           │── SELECT expediente ─────▶│
  │◀─ 200 { expediente } ─────│                          │
```

---

## Decisiones de arquitectura

### ADR-01: UUID como PK en lugar de SERIAL
**Decisión:** Usar UUID v4 en todas las tablas.
**Razón:** Facilita futura replicación/sharding y evita exposición de secuencias en URLs.
**Consecuencia:** Prisma usa `@default(dbgenerated("uuid_generate_v4()"))` requiriendo extensión `uuid-ossp`.

### ADR-02: Prisma como única interfaz a la BD
**Decisión:** Prohibir SQL raw salvo en migraciones (índices parciales, triggers, vistas).
**Razón:** Type-safety, previene SQL injection por construcción, migraciones reproducibles.
**Consecuencia:** Algunos features avanzados (partial indexes, GIN) se declaran en migraciones manuales.

### ADR-03: JWT stateless (sin blacklist)
**Decisión:** JWTs sin servidor de sesiones ni blacklist en Redis.
**Razón:** Simplicidad y costo — la clínica no justifica infraestructura extra.
**Consecuencia:** Un token robado es válido hasta expiración. Mitigado con TTL corto (30m web) y HTTPS obligatorio.

### ADR-04: App móvil solo lectura con header X-App-Source
**Decisión:** La restricción de solo lectura se aplica en el backend, no solo en el cliente.
**Razón:** Un cliente modificado podría omitir restricciones UI. La seguridad debe ser server-side.
**Consecuencia:** Middleware `readOnlyMobile` bloquea POST/PATCH/PUT/DELETE si detecta token de app móvil.

### ADR-05: Auditoría en la misma transacción
**Decisión:** El registro de auditoría se inserta en la misma transacción Prisma que la operación auditada.
**Razón:** Garantiza consistencia — si falla la operación, no hay registro de auditoría huérfano.
**Consecuencia:** Uso de `prisma.$transaction()` en todos los controladores que escriben datos críticos.

### ADR-06: Soft delete universal
**Decisión:** Ninguna entidad clínica se elimina físicamente. Solo `activo = false`.
**Razón:** Requerimiento legal/médico de retención de historial + RN-03.
**Consecuencia:** Todas las queries de lectura deben filtrar `activo: true` por defecto.

---

## Infraestructura de producción

```
Dominio → DNS (DigitalOcean)
         → Droplet Ubuntu 22.04 ($12/mes, 2 vCPU, 2GB RAM, 50GB SSD)
           ├── Nginx (puerto 80/443)
           │   ├── /api/* → proxy_pass localhost:3000  (Express)
           │   └── /*     → archivos estáticos /var/www/clinica (React build)
           ├── PM2
           │   └── node src/app.js (cluster mode, 2 workers)
           └── PostgreSQL 16 (localhost:5432)

Backups: cron job 2am → pg_dump | gzip → DO Spaces /backups/YYYY-MM-DD.sql.gz
Monitoreo: UptimeRobot (ping cada 5 min) + alertas email
TLS: Let's Encrypt (Certbot, renovación automática cada 90 días)
```

---

## Escalabilidad futura (no en scope v1)

- Separar BD a managed PostgreSQL de DO si el Droplet se queda corto
- Redis para blacklist de tokens si se requiere logout instantáneo
- Separar app React a CDN si el tráfico web crece
- Horizontal scaling de la API con PM2 cluster + load balancer
