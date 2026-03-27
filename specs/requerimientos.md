# Requerimientos Funcionales — Sistema de Gestión Clínica Médica

> Versión 1.0 | Autor: Kenny Sáenz | Última actualización: 2026-03-27

---

## Módulo 1: Autenticación y sesión

| ID    | Requerimiento | Rol(es) | Prioridad |
|-------|---------------|---------|-----------|
| RF-01 | Iniciar sesión con email y contraseña. Retorna JWT al autenticarse correctamente. | Todos | Alta |
| RF-02 | El administrador puede crear usuarios asignando nombre, email, contraseña temporal y rol. | administrador | Alta |
| RF-03 | El administrador puede editar y desactivar usuarios. No se eliminan físicamente. | administrador | Alta |
| RF-04 | La sesión web expira tras 30 minutos de inactividad. El sistema notifica antes del cierre. | Todos (web) | Alta |
| RF-05 | Cada login y logout genera un registro en `auditoria` con usuario, IP y timestamp. | Sistema | Alta |
| RF-06 | La app móvil usa JWT con sesión persistente (`exp: never`). Se puede cerrar sesión manualmente. | medico (móvil) | Alta |

---

## Módulo 2: Gestión de pacientes

| ID    | Requerimiento | Rol(es) | Prioridad |
|-------|---------------|---------|-----------|
| RF-07 | Registrar paciente: nombre completo, DPI (único), fecha de nacimiento, sexo, teléfono, dirección, correo, contacto de emergencia, seguro médico. | secretaria, administrador | Alta |
| RF-08 | Al crear un paciente, el sistema crea automáticamente su expediente médico vacío. | Sistema | Alta |
| RF-09 | Búsqueda de pacientes por nombre (difusa con pg_trgm) o DPI (exacto). Resultado en tiempo real. | Todos | Alta |
| RF-10 | Ver detalle de paciente: datos personales, expediente, historial de consultas y citas. | Todos | Alta |

---

## Módulo 3: Expediente médico

| ID    | Requerimiento | Rol(es) | Prioridad |
|-------|---------------|---------|-----------|
| RF-11 | El expediente incluye: tipo de sangre, alergias, enfermedades crónicas, medicamentos permanentes, antecedentes familiares, quirúrgicos y traumáticos. | medico | Alta |
| RF-12 | Los expedientes nunca se eliminan físicamente. Solo `activo = false`. (RN-03) | Sistema | Alta |
| RF-13 | El flag `tiene_alergias` se sincroniza automáticamente vía trigger al actualizar `alergias`. | Sistema | Alta |
| RF-14 | El historial de consultas se muestra ordenado del más reciente al más antiguo. | Todos | Alta |
| RF-15 | Solo el médico tratante puede registrar o editar diagnóstico y tratamiento. (RN-02) | medico | Alta |
| RF-16 | Subir archivos adjuntos al expediente. Máximo 10 MB. Almacenados en DigitalOcean Spaces. | medico, enfermera | Media |

---

## Módulo 4: Consultas médicas

| ID    | Requerimiento | Rol(es) | Prioridad |
|-------|---------------|---------|-----------|
| RF-17 | Registrar nota médica: motivo, código CIE-10, diagnóstico, tratamiento, medicamentos, indicaciones, días sugeridos para próxima cita. | medico | Alta |
| RF-18 | Una consulta puede estar ligada a una cita previa o ser emergencia directa. | medico | Alta |
| RF-19 | Toda consulta genera un evento en `auditoria`. (RN-06) | Sistema | Alta |

---

## Módulo 5: Signos vitales

| ID    | Requerimiento | Rol(es) | Prioridad |
|-------|---------------|---------|-----------|
| RF-20 | Registrar signos vitales por cita: presión arterial, temperatura, peso, talla, FC, SpO2, glucosa. | enfermera, medico | Alta |
| RF-21 | Solo se permite un registro de signos vitales por cita. | Sistema | Alta |

---

## Módulo 6: Control de citas

| ID    | Requerimiento | Rol(es) | Prioridad |
|-------|---------------|---------|-----------|
| RF-22 | Agendar cita con paciente, médico, fecha/hora y tipo de consulta. Valida conflictos. (RN-01) | secretaria, administrador | Alta |
| RF-23 | No pueden coexistir dos citas activas del mismo médico en el mismo horario. (RN-01) | Sistema | Alta |
| RF-24 | Ver agenda de un médico filtrada por fecha. | Todos | Alta |
| RF-25 | Cambiar estado de cita: pendiente → confirmada → en_atencion → atendida. | secretaria, medico | Alta |
| RF-26 | Cancelar cita requiere motivo obligatorio. (RN-05) | secretaria, medico, administrador | Alta |
| RF-27 | Enviar email de confirmación si el paciente tiene correo registrado. | Sistema | Media |

---

## Módulo 7: App móvil (emergencias)

| ID    | Requerimiento | Rol(es) | Prioridad |
|-------|---------------|---------|-----------|
| RF-28 | La app es solo lectura. No permite crear, editar ni eliminar datos. (RN-04) | medico (móvil) | Alta |
| RF-29 | Buscar paciente por nombre o DPI desde la app. | medico (móvil) | Alta |
| RF-30 | Ver expediente de emergencia: alergias (primero, en rojo), tipo de sangre, medicamentos permanentes, enfermedades crónicas, última consulta. | medico (móvil) | Alta |
| RF-31 | Las alergias se muestran al inicio con fondo rojo antes que cualquier otro dato. | medico (móvil) | Alta |
| RF-32 | Banner "SOLO LECTURA" visible y permanente en todas las pantallas del expediente. | medico (móvil) | Alta |
| RF-33 | La sesión persiste con AsyncStorage. No requiere reautenticarse al reabrir la app. | medico (móvil) | Alta |

---

## Módulo 8: Reportes y auditoría

| ID    | Requerimiento | Rol(es) | Prioridad |
|-------|---------------|---------|-----------|
| RF-34 | Reporte de citas por rango de fechas, filtrable por médico y estado. | administrador | Media |
| RF-35 | Reporte de pacientes atendidos por médico en un período. | administrador | Media |
| RF-36 | Bitácora de auditoría filtrable por usuario, acción y rango de fechas. Solo administrador. | administrador | Media |
| RF-37 | Exportar reportes a PDF. | administrador | Baja |

---

## Módulo 9: Catálogos

| ID    | Requerimiento | Rol(es) | Prioridad |
|-------|---------------|---------|-----------|
| RF-38 | CRUD de especialidades médicas. | administrador | Media |
| RF-39 | CRUD de tipos de consulta con duración en minutos. | administrador | Media |
| RF-40 | CRUD de horarios de atención por médico y día de la semana. | administrador | Media |
| RF-41 | Seed de catálogo CIE-10 con los 10 diagnósticos más frecuentes de la clínica. | administrador | Baja |
