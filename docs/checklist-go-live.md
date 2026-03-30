# Checklist de Go-Live — Sistema Clínica Médica

> Seguir este checklist en orden el día del lanzamiento.
> Período dual: 2 semanas operando sistema nuevo **y** proceso manual en paralelo.
> Al cerrar el período dual, el proceso manual se abandona oficialmente.

---

## Semana previa al go-live

### Infraestructura
- [ ] Droplet de DigitalOcean activo y accesible por SSH
- [ ] Dominio apuntando al Droplet (registro A en DNS)
- [ ] Certificado SSL emitido y renovación automática activa (`certbot renew --dry-run`)
- [ ] Nginx corriendo y respondiendo en HTTPS (`curl -I https://tu-dominio.gt`)
- [ ] Container Docker del backend levantado y passing health check
- [ ] Frontend desplegado en DO Spaces y accesible desde el navegador
- [ ] Variable `VITE_API_URL` apunta al dominio de producción (no a localhost)
- [ ] UptimeRobot monitoreando el endpoint de health check
- [ ] Cron de backup configurado (`crontab -l` muestra `0 2 * * *`)
- [ ] Primer backup manual exitoso en DO Spaces

### Base de datos
- [ ] Migraciones Prisma aplicadas en producción (`npx prisma migrate status` sin pendientes)
- [ ] Seed de catálogos CIE-10 ejecutado
- [ ] Especialidades de la clínica creadas en el catálogo
- [ ] Tipos de consulta creados (Consulta general, Control, Emergencia, etc.)
- [ ] Horarios de cada médico configurados

### Migración de datos
- [ ] Script `migrar-pacientes.js` ejecutado con `--dry-run` (sin errores)
- [ ] Script `migrar-pacientes.js` ejecutado en producción (revisar log de errores)
- [ ] Revisar una muestra de 10 expedientes migrados — verificar alergias y tipo de sangre
- [ ] Script `migrar-citas.js` ejecutado con `--dry-run` (sin errores)
- [ ] Script `migrar-citas.js` ejecutado en producción (revisar log de errores)
- [ ] Agenda del día de go-live verificada en el sistema

### Usuarios
- [ ] Cuenta de administrador creada y funcionando
- [ ] Cuentas de todos los médicos creadas (email + contraseña temporal)
- [ ] Cuentas de enfermeras creadas
- [ ] Cuenta de secretaria creada
- [ ] Cada usuario ha cambiado su contraseña temporal (o se les entregó la definitiva)
- [ ] Usuario `migracion@sistema.interno` está **desactivado** (no puede hacer login)

### App móvil
- [ ] APK instalado en el teléfono de cada médico
- [ ] Checklist de verificación completado por cada médico (ver `instalacion-app-movil.md`)

---

## Día de go-live

### Antes de abrir la clínica
- [ ] Verificar health check: `curl https://tu-dominio.gt/health`
- [ ] Ingresar al sistema como secretaria — verificar que la agenda del día carga
- [ ] Confirmar que el backup de la noche anterior está en DO Spaces
- [ ] Avisar a todo el personal que el sistema está activo

### Durante el período dual (primeras 2 semanas)

> El personal usa el sistema Y mantiene el proceso físico en paralelo.
> El objetivo es detectar bugs y ganar confianza antes de abandonar el papel.

- [ ] **Día 1-3:** Secretaria registra todas las citas en el sistema (además de la agenda física)
- [ ] **Día 1-3:** Enfermera registra signos vitales en el sistema al recibirlos
- [ ] **Día 1-5:** Médicos consultan expedientes desde la app en emergencias
- [ ] **Fin semana 1:** Reunión de retroalimentación — bugs encontrados anotados en el backlog
- [ ] **Semana 2:** Médicos registran notas de consulta en el sistema (además del papel)
- [ ] **Fin semana 2:** Revisión final — si todo OK, proceder al cierre del período dual

### Criterios para PASAR el período dual
- [ ] Sistema disponible >99% del tiempo (sin caídas mayores a 5 min)
- [ ] Secretaria puede operar el día completo sin ayuda técnica
- [ ] No se encontraron bugs críticos sin resolver
- [ ] Todos los médicos acceden exitosamente a expedientes desde la app
- [ ] Los backups diarios se están ejecutando correctamente

---

## Cierre del período dual

> Solo proceder cuando todos los criterios anteriores están cumplidos.

- [ ] Reunión de cierre con todo el personal
- [ ] Confirmar que el 100% de expedientes físicos activos están digitalizados
- [ ] Archivar los expedientes físicos (no destruir — guardar por 5 años mínimo)
- [ ] Anuncio oficial: el sistema es el único registro válido a partir de esta fecha
- [ ] Retirar agendas físicas del área de recepción
- [ ] Documentar la fecha de cierre: ___________________________

---

## Contactos de soporte durante go-live

| Situación | Acción |
|-----------|--------|
| Sistema caído | Kenny Sáenz — WhatsApp inmediato |
| Usuario no puede entrar | Administrador restablece contraseña |
| Datos incorrectamente migrados | Kenny Sáenz — corrección manual con herramienta de admin |
| Bug crítico en horario laboral | WhatsApp → corrección en el día |

---

## Rollback (solo si hay problema crítico)

Si el sistema falla de forma irrecuperable durante las primeras 2 semanas:
1. El proceso físico (agenda/expedientes en papel) sigue disponible como respaldo
2. Notificar a Kenny Sáenz con el error específico
3. NO abandonar el proceso manual hasta que el sistema esté estable

---

*Versión: 1.0 | Sistema Clínica Médica*
