# Sistema de Gestión — Clínica Médica
> Archivo de contexto para Claude Code. Se lee al inicio de cada sesión.

## Identidad del proyecto
Sistema web + app móvil para digitalizar expedientes médicos y control de citas.
Problema central: médicos que atienden emergencias nocturnas sin acceso al historial del paciente.
Solución: API REST + React web + React Native móvil desplegado en DigitalOcean.

## Stack tecnológico (no negociable)
- **Backend:** Node.js 20 LTS + Express 5 + Prisma ORM + JWT + bcrypt + Helmet.js
- **Frontend web:** React 18 + React Router + React Query + Tailwind CSS
- **App móvil:** React Native 0.74 + Expo + AsyncStorage + React Navigation
- **Base de datos:** PostgreSQL 16 (schema en /database/clinica_db_creation.sql)
- **Infra:** DigitalOcean Droplet $12/mes + Nginx + PM2 + Let's Encrypt

## Estructura de carpetas del monorepo
```
clinica-sistema/
├── CLAUDE.md
├── ROADMAP.md
├── specs/
│   ├── requerimientos.md
│   ├── reglas-negocio.md
│   └── arquitectura.md
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   └── services/
│   └── package.json
└── database/
    └── clinica_db_creation.sql
```

## Reglas de negocio críticas (NUNCA romper)
- **RN-01:** No pueden existir dos citas activas para el mismo médico en el mismo horario.
- **RN-02:** Solo el médico tratante puede escribir o editar diagnóstico/tratamiento.
- **RN-03:** Los expedientes NUNCA se eliminan físicamente — solo `activo = false`.
- **RN-04:** La app móvil es SOLO LECTURA — nunca permite escribir ni editar.
- **RN-05:** Al cancelar una cita, el motivo de cancelación es obligatorio.
- **RN-06:** Toda modificación genera un registro en la tabla `auditoria` con usuario, fecha y IP.

## Roles y permisos
| Rol           | Puede hacer                                              |
|---------------|----------------------------------------------------------|
| administrador | Todo + gestión de usuarios y catálogos                  |
| medico        | Leer/escribir expedientes y consultas, ver citas         |
| enfermera     | Registrar signos vitales, ver expedientes (lectura)      |
| secretaria    | Crear pacientes básicos, gestionar citas                 |
| (app móvil)   | Solo lectura — cualquier médico autenticado             |

## Convenciones de código

### Backend
- Rutas en `kebab-case`: `/api/pacientes`, `/api/signos-vitales`
- Controladores con un método por responsabilidad
- Siempre usar Prisma para queries — nunca SQL raw salvo migraciones
- Validación de input con Zod antes de llegar al controlador
- Errores con estructura uniforme: `{ error: true, message: string, code: string }`
- Todo endpoint protegido verifica JWT y rol antes de ejecutarse

### Frontend
- Componentes en PascalCase: `ExpedienteCard.jsx`
- Hooks personalizados con prefijo `use`: `useExpediente.js`
- React Query para toda comunicación con la API
- Tailwind para estilos — no CSS personalizado salvo casos excepcionales

### Commits (GitFlow)
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `refactor:` mejora de código sin cambiar comportamiento
- `test:` agregar o corregir pruebas
- `chore:` configuración, dependencias, scripts
- Commits atómicos: un commit = un cambio lógico
- Sin atribución de Claude en commits — el autor eres tú

### Git branches
- `main` → producción (solo merge desde `develop` con PR)
- `develop` → integración de sprints
- `feat/nombre-feature` → desarrollo de funcionalidades
- `fix/nombre-bug` → correcciones

## Seguridad (verificar en cada endpoint nuevo)
- [ ] JWT verificado en el middleware `authMiddleware`
- [ ] Rol validado con `requireRole(['medico', 'admin'])`
- [ ] Input validado con Zod schema
- [ ] Query usa Prisma (no SQL raw con interpolación)
- [ ] Datos sensibles nunca en logs

## Variables de entorno requeridas (ver .env.example)
NUNCA hardcodear en el código:
- `DATABASE_URL` — string de conexión PostgreSQL
- `JWT_SECRET` — mínimo 32 caracteres aleatorios
- `JWT_EXPIRES_IN` — ej: `30m` para web, `never` para mobile
- `SPACES_KEY` / `SPACES_SECRET` — DigitalOcean Spaces
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` — servicio de correo

## Cómo trabajamos sprint a sprint
1. Consultar `ROADMAP.md` para ver qué tarea está `[-]` en progreso
2. Si no hay tarea en progreso, tomar la siguiente `[ ]` de prioridad Alta
3. Implementar → prueba → commit → marcar `[x]` en ROADMAP
4. Al terminar un sprint completo, avisar para revisar juntos antes del siguiente

## Archivos de specs de referencia
- Requerimientos funcionales RF-01 a RF-36: `specs/requerimientos.md`
- Arquitectura y decisiones técnicas: `specs/arquitectura.md`
- Reglas de negocio detalladas: `specs/reglas-negocio.md`
- Script SQL completo: `database/clinica_db_creation.sql`

---
*Proyecto: Sistema Clínica Médica | Dev: Kenny Sáenz | Stack: Node + React + RN + PostgreSQL*
