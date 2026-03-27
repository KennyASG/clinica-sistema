# Roadmap — Sistema de Gestión Clínica Médica

## Convención de estados
- `[ ]` = Pendiente
- `[-]` = En progreso 🏗️ YYYY-MM-DD
- `[x]` = Completado ✅ YYYY-MM-DD

---

## FASE 0 — Setup inicial del proyecto
> Objetivo: Repositorio listo, estructura de carpetas, conexión a BD funcional.

- [x] **Crear monorepo con estructura de carpetas** — `/backend`, `/frontend`, `/mobile`, `/database`, `/specs` ✅ 2026-03-27
- [ ] **Configurar backend base** — Node.js + Express + Prisma + variables de entorno
- [ ] **Trasladar schema SQL a Prisma** — Convertir `clinica_db_creation.sql` a `schema.prisma`
- [ ] **Configurar frontend base** — React + Vite + Tailwind + React Router + React Query
- [ ] **Configurar mobile base** — Expo + React Navigation + AsyncStorage
- [x] **Configurar GitHub repo** — Branches `main` y `develop`, `.gitignore` por subcarpeta ✅ 2026-03-27
- [ ] **Crear archivos de specs** — Copiar requerimientos y reglas de negocio a `/specs/`
- [ ] **Configurar `.env.example`** — Todas las variables sin valores reales

---

## SPRINT 1-2 — Autenticación y gestión de usuarios
> Semanas 3-6 | Meta: cualquier rol puede autenticarse y el admin puede configurar la clínica.

### Backend
- [ ] **RF-01** — `POST /api/auth/login` — Login con email + password, retorna JWT
- [ ] **RF-04** — Middleware de expiración de sesión (30 min inactividad en web)
- [ ] **RF-05** — Registro automático en tabla `auditoria` en cada login/logout
- [ ] **RF-06** — JWT con `exp: never` para app móvil (sesión persistente)
- [ ] **RF-02/03** — CRUD de usuarios (solo admin): `GET/POST/PATCH /api/usuarios`
- [ ] **Middleware `authMiddleware`** — Verifica JWT en cada request protegido
- [ ] **Middleware `requireRole`** — Valida que el rol del token tenga permiso al endpoint

### Frontend web
- [ ] **Pantalla Login** — Formulario email/password, manejo de error, redirección por rol
- [ ] **Layout base con sidebar** — Navegación diferente por rol (secretaria vs médico vs admin)
- [ ] **Pantalla gestión de usuarios (admin)** — Tabla de usuarios, crear/editar/desactivar

### Pruebas Sprint 1-2
- [ ] Prueba: login con credenciales inválidas retorna 401
- [ ] Prueba: usuario con rol `secretaria` no puede acceder a `POST /api/consultas` (403)
- [ ] Prueba: token expirado retorna 401 con mensaje claro

---

## SPRINT 3-4 — Expediente médico (núcleo del sistema)
> Semanas 7-10 | Meta: el expediente digital funciona completo.

### Backend
- [ ] **RF-07** — `POST /api/pacientes` — Crear paciente con validación de DPI único
- [ ] **RF-09** — `GET /api/pacientes?q=` — Búsqueda difusa por nombre o DPI (pg_trgm)
- [ ] **RF-08** — `POST /api/expedientes` — Crear expediente médico base
- [ ] **RF-15** — Flag `tiene_alergias` se sincroniza via trigger al actualizar alergias
- [ ] **RF-14** — `GET /api/expedientes/:id/historial` — Historial ordenado más reciente primero
- [ ] **RF-10** — `POST /api/consultas` — Registrar nota médica (solo rol médico — RN-02)
- [ ] **RF-11** — `POST /api/signos-vitales` — Registrar signos vitales (enfermera/médico)
- [ ] **RF-12** — Expedientes no se eliminan — solo `PATCH activo: false` (RN-03)
- [ ] **RF-13** — `POST /api/documentos` — Subir archivo adjunto a DO Spaces (max 10MB)
- [ ] **RN-06** — Todo PATCH/POST a expediente genera registro en `auditoria`

### Frontend web
- [ ] **Pantalla búsqueda de pacientes** — Searchbar con resultados en tiempo real
- [ ] **Pantalla crear paciente** — Formulario completo con validación
- [ ] **Pantalla expediente** — Alerta roja de alergias, datos base, historial de consultas
- [ ] **Modal nueva consulta (médico)** — Campos: motivo, diagnóstico CIE-10, tratamiento
- [ ] **Formulario signos vitales (enfermera)** — Previo a cada consulta

### Pruebas Sprint 3-4
- [ ] Prueba: búsqueda "garcia" encuentra "García López" (búsqueda difusa)
- [ ] Prueba: alerta de alergia aparece al abrir expediente con alergias registradas
- [ ] Prueba: enfermera no puede hacer POST a /api/consultas (403)
- [ ] Prueba: DELETE a expediente retorna 405 Method Not Allowed

---

## SPRINT 5-6 — Control de citas y agenda
> Semanas 11-14 | Meta: la secretaria puede reemplazar la agenda física.

### Backend
- [ ] **RF-16** — `POST /api/citas` — Agendar cita con validación de conflicto (RN-01)
- [ ] **RF-17** — Índice único parcial en BD previene doble booking (ya en schema SQL)
- [ ] **RF-18** — `GET /api/citas?medico=&fecha=` — Agenda del médico por fecha
- [ ] **RF-19** — `PATCH /api/citas/:id` — Cambiar estado de cita
- [ ] **RF-20** — Al cancelar, motivo es obligatorio en el body (RN-05)
- [ ] **RF-22** — Envío de email de confirmación con Nodemailer si paciente tiene correo

### Frontend web
- [ ] **Dashboard secretaria** — Agenda del día con métricas y buscador
- [ ] **Formulario nueva cita** — Búsqueda de paciente, selección de médico, calendario
- [ ] **Vista de calendario semanal por médico** — Slots ocupados/libres
- [ ] **Modal cancelar cita** — Campo obligatorio de motivo

### Pruebas Sprint 5-6
- [ ] Prueba: intentar agendar en horario ocupado retorna error descriptivo
- [ ] Prueba: cancelar cita sin motivo retorna 422
- [ ] Prueba: agenda del día muestra solo citas no canceladas

---

## SPRINT 7-8 — App móvil React Native (emergencia)
> Semanas 12-15 | Meta: el médico puede atender emergencias con historial en su teléfono.

### Backend
- [ ] **Vista `v_expediente_emergencia`** — Ya definida en SQL, verificar que funciona con Prisma
- [ ] **RF-23** — `GET /api/pacientes?q=` — Mismo endpoint que web, reutilizable en móvil
- [ ] **RF-26** — Middleware `readOnlyMobile` — Si request viene de app móvil, bloquear POST/PATCH/DELETE

### App móvil
- [ ] **Pantalla Login** — Mismas credenciales que web, JWT con sesión persistente
- [ ] **Pantalla búsqueda de paciente** — Searchbar simple, resultados limpios
- [ ] **Pantalla expediente (solo lectura)** — RF-24: alergias PRIMERO en rojo, medicamentos en azul
- [ ] **Banner "Solo lectura"** — Visible y permanente en todas las pantallas del expediente
- [ ] **RF-27** — Persistencia de sesión con AsyncStorage

### Pruebas Sprint 7-8
- [ ] Prueba: app en Android muestra alerta de alergia antes de scroll
- [ ] Prueba: request POST desde app móvil con token válido retorna 403
- [ ] Prueba: sesión persiste al cerrar y reabrir la app

---

## SPRINT 9 — Reportes, auditoría y catálogos
> Semanas 15-16 | Meta: el administrador tiene visibilidad completa.

- [ ] **RF-33** — `GET /api/reportes/citas` — Por rango de fechas, filtrable por médico y estado
- [ ] **RF-34** — `GET /api/reportes/pacientes` — Atendidos por médico en un período
- [ ] **RF-35** — `GET /api/auditoria` — Bitácora filtrable (solo admin)
- [ ] **RF-36** — Exportación de reportes a PDF con `pdfkit` o similar
- [ ] **RF-28/31** — CRUD de catálogos: especialidades, horarios, tipos de consulta
- [ ] **RF-29** — Seed de catálogo CIE-10 básico (10 diagnósticos más frecuentes de la clínica)
- [ ] **Pantalla reportes (frontend)** — Filtros de fecha/médico, tabla de resultados, botón PDF
- [ ] **Pantalla auditoría (frontend)** — Tabla de eventos con usuario y timestamp

---

## SPRINT 10 — QA, integración y preparación para go-live
> Semanas 17-18 | Meta: sistema aprobado por el cliente (UAT).

- [ ] **Pruebas de integración end-to-end** — Flujo completo: login → buscar paciente → consulta → cita
- [ ] **UAT con usuario real** — Secretaria opera el sistema 3 días consecutivos
- [ ] **Pruebas de seguridad** — Verificar que cada rol solo accede a lo que le corresponde
- [ ] **Prueba de carga** — 20 usuarios concurrentes sin degradación (Artillery o k6)
- [ ] **Corrección de bugs encontrados en UAT**
- [ ] **Documentación de usuario final** — Guía rápida de 1 página por rol (imprimible)
- [ ] **Setup de monitoreo** — UptimeRobot + alertas por email
- [ ] **Configuración de backups automáticos** — Cron job diario a las 2am → DO Spaces

---

## FASE 2 — Migración de datos y go-live
> Semanas 19-24 | Paralelo al Sprint 9-10.

- [ ] **Script de migración** — CSV/Excel de expedientes físicos → importador al sistema
- [ ] **Migración de expedientes** — Digitalizar 100% de expedientes físicos existentes
- [ ] **Migración de citas pendientes** — Pasar agenda física al sistema
- [ ] **Sesiones de capacitación presenciales** — Por rol en la clínica
- [ ] **Instalación de app móvil** — En el teléfono de cada médico + verificación de acceso
- [ ] **Go-live** — Sistema en producción con período dual de 2 semanas
- [ ] **Cierre período dual** — Abandonar proceso manual oficial ✅

---

## Backlog futuro (no en scope v1)
- [ ] Facturación electrónica / integración SAT
- [ ] Portal del paciente (consulta de sus propias citas)
- [ ] Integración con laboratorios externos
- [ ] Telemedicina / videoconsulta
- [ ] Catálogo CIE-10 completo (más de 14,000 códigos)
- [ ] App móvil en Play Store / App Store

---

*Última actualización: 2026-03-26 | Próximo sprint: FASE 0 — Setup inicial*
