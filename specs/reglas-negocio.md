# Reglas de Negocio — Sistema de Gestión Clínica Médica

> Versión 1.0 | Autor: Kenny Sáenz | Última actualización: 2026-03-27
> Estas reglas son INVARIABLES. Ningún sprint puede romperlas.

---

## RN-01 — No double booking de médicos

**Regla:** No pueden existir dos citas activas para el mismo médico en el mismo horario.

**Implementación:**
- Índice único parcial en la BD: `CREATE UNIQUE INDEX idx_cita_no_overlap ON cita (medico_id, fecha_hora_inicio) WHERE estado NOT IN ('cancelada', 'no_presentada')`
- El backend valida antes de insertar y retorna `409 Conflict` con mensaje descriptivo si hay conflicto.
- La UI muestra el slot como ocupado y no permite seleccionarlo.

**Excepción:** Citas en estado `cancelada` o `no_presentada` no cuentan como ocupadas.

---

## RN-02 — Solo el médico tratante escribe diagnóstico y tratamiento

**Regla:** Únicamente el médico asignado a una consulta puede crear o modificar los campos: `diagnostico_descripcion`, `diagnostico_cie10`, `tratamiento`, `medicamentos_recetados`.

**Implementación:**
- El middleware `requireRole(['medico'])` protege `POST /api/consultas` y `PATCH /api/consultas/:id`.
- El controlador verifica que `req.user.id === consulta.medico_id` antes de cualquier escritura.
- Si el usuario es médico pero no es el tratante, retorna `403 Forbidden`.
- Trigger en BD: `trg_validar_medico_consulta` valida que `medico_id` tenga rol `medico`.

---

## RN-03 — Expedientes nunca se eliminan físicamente

**Regla:** Los expedientes médicos son permanentes. La única operación de "eliminación" permitida es `PATCH activo = false`.

**Implementación:**
- El endpoint `DELETE /api/expedientes/:id` retorna `405 Method Not Allowed`.
- Solo existe `PATCH /api/expedientes/:id` con `{ activo: false }`.
- Restricción de FK en BD (`ON DELETE RESTRICT`) impide borrar pacientes con expediente.
- Los expedientes inactivos no aparecen en búsquedas pero siguen siendo auditables.

**Aplica también a:** pacientes (`activo = false`).

---

## RN-04 — La app móvil es solo lectura

**Regla:** La app React Native no puede crear, modificar ni eliminar ningún dato del sistema.

**Implementación:**
- Middleware `readOnlyMobile` en el backend: si el header `X-App-Source: mobile` está presente, bloquea cualquier request `POST`, `PATCH`, `PUT` o `DELETE` con `403 Forbidden`.
- Alternativamente, tokens de la app móvil incluyen `readonly: true` en el payload JWT.
- La app no renderiza formularios de edición — todas las pantallas son de visualización.
- Banner "SOLO LECTURA" permanente en pantallas de expediente (RF-32).

---

## RN-05 — Motivo de cancelación obligatorio

**Regla:** No se puede cambiar el estado de una cita a `cancelada` sin proporcionar `motivo_cancelacion`.

**Implementación:**
- Constraint en BD: `CHECK ((estado = 'cancelada' AND motivo_cancelacion IS NOT NULL) OR estado != 'cancelada')`
- El schema Zod del endpoint `PATCH /api/citas/:id` valida que si `estado === 'cancelada'`, entonces `motivo_cancelacion` sea requerido y no vacío.
- El frontend muestra un modal con campo obligatorio antes de confirmar la cancelación.
- Error en caso de omisión: `422 Unprocessable Entity` con `code: 'MOTIVO_CANCELACION_REQUERIDO'`.

---

## RN-06 — Toda modificación genera registro de auditoría

**Regla:** Cada operación de escritura (INSERT, UPDATE) sobre tablas críticas debe generar un registro en la tabla `auditoria` con: usuario_id, acción, tabla afectada, ID del registro, datos anteriores (JSONB), datos nuevos (JSONB), IP del cliente y timestamp.

**Tablas auditadas:** `usuario`, `paciente`, `expediente`, `consulta`, `cita`, `signos_vitales`, `documento_adjunto`.

**Implementación:**
- Función utilitaria `registrarAuditoria(prisma, { usuarioId, accion, tabla, registroId, datosAntes, datosDespues, ip })` en `src/utils/auditoria.js`.
- Se llama al final de cada controlador que modifique datos, dentro de la misma transacción Prisma.
- Acciones registradas: `INSERT`, `UPDATE`, `DELETE` (soft), `LOGIN`, `LOGOUT`, `VIEW` (expediente), `EXPORT`.
- La tabla `auditoria` es append-only — nunca se modifica ni elimina un registro de auditoría.

---

## Resumen de implicaciones por capa

| Regla | BD | Backend | Frontend | Móvil |
|-------|----|---------|----------|-------|
| RN-01 | Índice parcial | Validación + 409 | Slots ocupados | N/A |
| RN-02 | Trigger rol | requireRole + owner check | Campos deshabilitados | Solo lectura |
| RN-03 | ON DELETE RESTRICT | 405 en DELETE | Sin botón eliminar | Sin botón eliminar |
| RN-04 | N/A | Middleware readOnly | N/A | Banner + sin forms |
| RN-05 | CHECK constraint | Zod schema | Modal con campo req. | N/A |
| RN-06 | N/A | Util auditoria | N/A | N/A |
