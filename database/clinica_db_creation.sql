-- =============================================================================
-- SISTEMA DE GESTIÓN DE CLÍNICA MÉDICA
-- Script de creación de base de datos — PostgreSQL 16
-- Universidad Mariano Gálvez de Guatemala
-- Autor: Kenny Amadeus Sáenz Galicia
-- Versión: 1.0
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONFIGURACIÓN INICIAL
-- -----------------------------------------------------------------------------
\c postgres;
DROP DATABASE IF EXISTS clinica_db;
CREATE DATABASE clinica_db
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'es_GT.UTF-8'
    LC_CTYPE   = 'es_GT.UTF-8'
    TEMPLATE   = template0;

\c clinica_db;

-- Extensión para UUID nativos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda por texto similar

-- =============================================================================
-- SECCIÓN 1: TIPOS ENUMERADOS
-- =============================================================================

CREATE TYPE rol_usuario AS ENUM (
    'administrador',
    'medico',
    'enfermera',
    'secretaria'
);

CREATE TYPE sexo_paciente AS ENUM (
    'masculino',
    'femenino',
    'otro'
);

CREATE TYPE tipo_sangre AS ENUM (
    'A+', 'A-',
    'B+', 'B-',
    'AB+', 'AB-',
    'O+', 'O-',
    'desconocido'
);

CREATE TYPE estado_cita AS ENUM (
    'pendiente',
    'confirmada',
    'en_atencion',
    'atendida',
    'cancelada',
    'no_presentada'
);

CREATE TYPE dia_semana AS ENUM (
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'domingo'
);

-- =============================================================================
-- SECCIÓN 2: TABLAS DE CATÁLOGOS (sin dependencias externas)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: especialidad
-- Catálogo de especialidades médicas disponibles en la clínica
-- ----------------------------------------------------------------------------
CREATE TABLE especialidad (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_especialidad_nombre UNIQUE (nombre)
);

COMMENT ON TABLE especialidad IS 'Catálogo de especialidades médicas de la clínica';

-- ----------------------------------------------------------------------------
-- Tabla: tipo_consulta
-- Catálogo de tipos de consulta (primera vez, seguimiento, emergencia, control)
-- ----------------------------------------------------------------------------
CREATE TABLE tipo_consulta (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre              VARCHAR(80) NOT NULL,
    descripcion         TEXT,
    duracion_minutos    INTEGER     NOT NULL DEFAULT 30,
    activo              BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tipo_consulta_nombre UNIQUE (nombre),
    CONSTRAINT ck_duracion_positiva CHECK (duracion_minutos > 0)
);

COMMENT ON TABLE tipo_consulta IS 'Tipos de consulta médica disponibles';

-- =============================================================================
-- SECCIÓN 3: TABLAS DE USUARIOS Y AUTENTICACIÓN
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: usuario
-- Todos los usuarios del sistema (médicos, enfermeras, secretarias, admin)
-- ----------------------------------------------------------------------------
CREATE TABLE usuario (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo     VARCHAR(200)    NOT NULL,
    email               VARCHAR(150)    NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    rol                 rol_usuario     NOT NULL,
    numero_colegiado    VARCHAR(20),     -- Solo aplica para médicos
    telefono            VARCHAR(20),
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    intentos_fallidos   INTEGER         NOT NULL DEFAULT 0,
    bloqueado_hasta     TIMESTAMP,
    creado_en           TIMESTAMP       NOT NULL DEFAULT NOW(),
    ultimo_acceso       TIMESTAMP,
    creado_por          UUID            REFERENCES usuario(id),

    CONSTRAINT uq_usuario_email UNIQUE (email),
    CONSTRAINT ck_intentos_fallidos CHECK (intentos_fallidos >= 0)
);

COMMENT ON TABLE usuario IS 'Usuarios del sistema con sus roles y credenciales';
COMMENT ON COLUMN usuario.numero_colegiado IS 'Número de colegiado médico — solo requerido para rol médico';
COMMENT ON COLUMN usuario.bloqueado_hasta IS 'Cuenta bloqueada temporalmente tras 5 intentos fallidos';

-- ----------------------------------------------------------------------------
-- Tabla: medico_especialidad
-- Relación muchos a muchos entre médico y especialidad
-- Un médico puede tener varias especialidades
-- ----------------------------------------------------------------------------
CREATE TABLE medico_especialidad (
    medico_id       UUID    NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    especialidad_id UUID    NOT NULL REFERENCES especialidad(id) ON DELETE CASCADE,
    es_principal    BOOLEAN NOT NULL DEFAULT FALSE,
    asignado_en     TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (medico_id, especialidad_id)
);

COMMENT ON TABLE medico_especialidad IS 'Especialidades asignadas a cada médico';

-- ----------------------------------------------------------------------------
-- Tabla: horario_medico
-- Horarios de atención por médico y día de la semana
-- ----------------------------------------------------------------------------
CREATE TABLE horario_medico (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id           UUID        NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    dia                 dia_semana  NOT NULL,
    hora_inicio         TIME        NOT NULL,
    hora_fin            TIME        NOT NULL,
    duracion_cita_min   INTEGER     NOT NULL DEFAULT 30,
    activo              BOOLEAN     NOT NULL DEFAULT TRUE,

    CONSTRAINT ck_horario_valido CHECK (hora_inicio < hora_fin),
    CONSTRAINT ck_duracion_cita  CHECK (duracion_cita_min > 0),
    CONSTRAINT uq_medico_dia     UNIQUE (medico_id, dia)
);

COMMENT ON TABLE horario_medico IS 'Horarios de disponibilidad de cada médico por día';

-- =============================================================================
-- SECCIÓN 4: TABLAS DE PACIENTES Y EXPEDIENTES
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: paciente
-- Datos personales y de contacto del paciente
-- ----------------------------------------------------------------------------
CREATE TABLE paciente (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo         VARCHAR(200)    NOT NULL,
    dpi                     VARCHAR(15)     NOT NULL,
    fecha_nacimiento        DATE            NOT NULL,
    sexo                    sexo_paciente   NOT NULL,
    telefono                VARCHAR(20)     NOT NULL,
    telefono_emergencia     VARCHAR(20),
    contacto_emergencia     VARCHAR(200),
    direccion               TEXT,
    correo                  VARCHAR(150),
    seguro_medico           VARCHAR(100),
    numero_poliza           VARCHAR(50),
    activo                  BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en               TIMESTAMP       NOT NULL DEFAULT NOW(),
    creado_por              UUID            NOT NULL REFERENCES usuario(id),

    CONSTRAINT uq_paciente_dpi UNIQUE (dpi)
);

COMMENT ON TABLE paciente IS 'Datos personales y de contacto de los pacientes';
COMMENT ON COLUMN paciente.dpi IS 'Documento Personal de Identificación — 13 dígitos Guatemala';

-- ----------------------------------------------------------------------------
-- Tabla: expediente
-- Información médica base del paciente (1 expediente por paciente)
-- ----------------------------------------------------------------------------
CREATE TABLE expediente (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id             UUID        NOT NULL REFERENCES paciente(id),
    tipo_sangre             tipo_sangre NOT NULL DEFAULT 'desconocido',
    alergias                TEXT,
    tiene_alergias          BOOLEAN     NOT NULL DEFAULT FALSE,
    enfermedades_cronicas   TEXT,
    medicamentos_permanentes TEXT,
    antecedentes_familiares TEXT,
    antecedentes_quirurgicos TEXT,
    antecedentes_traumaticos TEXT,
    observaciones_generales TEXT,
    activo                  BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en               TIMESTAMP   NOT NULL DEFAULT NOW(),
    actualizado_en          TIMESTAMP   NOT NULL DEFAULT NOW(),
    creado_por              UUID        NOT NULL REFERENCES usuario(id),
    actualizado_por         UUID        REFERENCES usuario(id),

    CONSTRAINT uq_expediente_paciente UNIQUE (paciente_id)
);

COMMENT ON TABLE expediente IS 'Historial médico base del paciente — nunca se elimina';
COMMENT ON COLUMN expediente.tiene_alergias IS 'Flag para mostrar alerta visual rápida sin parsear el texto';
COMMENT ON COLUMN expediente.activo IS 'Nunca se elimina — solo se desactiva (RN-03)';

-- ----------------------------------------------------------------------------
-- Tabla: documento_adjunto
-- Archivos adjuntos al expediente (laboratorios, imágenes, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE documento_adjunto (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    expediente_id   UUID        NOT NULL REFERENCES expediente(id) ON DELETE RESTRICT,
    nombre_archivo  VARCHAR(255) NOT NULL,
    descripcion     VARCHAR(255),
    url_storage     TEXT        NOT NULL,
    tipo_mime       VARCHAR(100) NOT NULL,
    tamano_bytes    INTEGER     NOT NULL,
    subido_en       TIMESTAMP   NOT NULL DEFAULT NOW(),
    subido_por      UUID        NOT NULL REFERENCES usuario(id),

    CONSTRAINT ck_tamano_positivo CHECK (tamano_bytes > 0),
    CONSTRAINT ck_tamano_maximo   CHECK (tamano_bytes <= 10485760) -- 10MB max
);

COMMENT ON TABLE documento_adjunto IS 'Archivos adjuntos al expediente (PDFs, imágenes diagnósticas)';

-- =============================================================================
-- SECCIÓN 5: TABLAS DE CITAS Y CONSULTAS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: cita
-- Agendamiento de citas médicas
-- ----------------------------------------------------------------------------
CREATE TABLE cita (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id         UUID            NOT NULL REFERENCES paciente(id),
    medico_id           UUID            NOT NULL REFERENCES usuario(id),
    tipo_consulta_id    UUID            NOT NULL REFERENCES tipo_consulta(id),
    fecha_hora_inicio   TIMESTAMP       NOT NULL,
    fecha_hora_fin      TIMESTAMP       NOT NULL,
    estado              estado_cita     NOT NULL DEFAULT 'pendiente',
    motivo_cancelacion  TEXT,
    cancelado_por       UUID            REFERENCES usuario(id),
    cancelado_en        TIMESTAMP,
    notas_secretaria    TEXT,
    creado_en           TIMESTAMP       NOT NULL DEFAULT NOW(),
    creado_por          UUID            NOT NULL REFERENCES usuario(id),

    CONSTRAINT ck_cita_fechas_validas CHECK (fecha_hora_inicio < fecha_hora_fin),
    CONSTRAINT ck_cancelacion_requiere_motivo CHECK (
        (estado = 'cancelada' AND motivo_cancelacion IS NOT NULL)
        OR estado != 'cancelada'
    )
);

COMMENT ON TABLE cita IS 'Agendamiento de citas médicas con control de disponibilidad';
COMMENT ON COLUMN cita.motivo_cancelacion IS 'Obligatorio cuando estado = cancelada (RN-05)';

-- Índice para validar conflictos de horario (RN-01)
CREATE UNIQUE INDEX idx_cita_no_overlap
    ON cita (medico_id, fecha_hora_inicio)
    WHERE estado NOT IN ('cancelada', 'no_presentada');

-- ----------------------------------------------------------------------------
-- Tabla: signos_vitales
-- Registrados por la enfermera antes de la consulta
-- Ligado a CITA, no a CONSULTA (se toman antes que el médico abra la nota)
-- ----------------------------------------------------------------------------
CREATE TABLE signos_vitales (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id             UUID        NOT NULL REFERENCES cita(id) ON DELETE RESTRICT,
    enfermera_id        UUID        NOT NULL REFERENCES usuario(id),
    presion_arterial    VARCHAR(10),    -- Ej: "120/80"
    temperatura_c       DECIMAL(4,1),  -- Grados Celsius
    peso_kg             DECIMAL(5,2),
    talla_cm            DECIMAL(5,1),
    frecuencia_cardiaca INTEGER,        -- Latidos por minuto
    saturacion_o2       INTEGER,        -- Porcentaje SpO2
    glucosa_mgdl        INTEGER,        -- mg/dL (opcional)
    observaciones       TEXT,
    registrado_en       TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_signos_por_cita   UNIQUE (cita_id),
    CONSTRAINT ck_temperatura_rango CHECK (temperatura_c BETWEEN 30 AND 45),
    CONSTRAINT ck_peso_positivo     CHECK (peso_kg > 0),
    CONSTRAINT ck_talla_positiva    CHECK (talla_cm > 0),
    CONSTRAINT ck_fc_rango          CHECK (frecuencia_cardiaca BETWEEN 20 AND 300),
    CONSTRAINT ck_spo2_rango        CHECK (saturacion_o2 BETWEEN 0 AND 100)
);

COMMENT ON TABLE signos_vitales IS 'Signos vitales tomados por enfermera antes de cada consulta';

-- ----------------------------------------------------------------------------
-- Tabla: consulta
-- Nota médica de la consulta — solo el médico puede escribirla (RN-02)
-- ----------------------------------------------------------------------------
CREATE TABLE consulta (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    expediente_id           UUID        NOT NULL REFERENCES expediente(id),
    cita_id                 UUID        REFERENCES cita(id),
    medico_id               UUID        NOT NULL REFERENCES usuario(id),
    fecha_hora              TIMESTAMP   NOT NULL DEFAULT NOW(),
    motivo_consulta         TEXT        NOT NULL,
    diagnostico_cie10       VARCHAR(10),    -- Código CIE-10
    diagnostico_descripcion TEXT,
    tratamiento             TEXT,
    medicamentos_recetados  TEXT,
    indicaciones_generales  TEXT,
    proxima_cita_dias       INTEGER,        -- Sugerencia de seguimiento
    es_emergencia           BOOLEAN     NOT NULL DEFAULT FALSE,
    creado_en               TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_prox_cita_positivo CHECK (proxima_cita_dias IS NULL OR proxima_cita_dias > 0)
);

COMMENT ON TABLE consulta IS 'Nota médica de consulta — solo escritura por médico tratante (RN-02)';
COMMENT ON COLUMN consulta.es_emergencia IS 'TRUE cuando la consulta fue registrada desde la app móvil fuera de horario';

-- =============================================================================
-- SECCIÓN 6: TABLA DE AUDITORÍA
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: auditoria
-- Registro de todos los cambios en el sistema (RN-06)
-- JSON para datos_anteriores y datos_nuevos — flexible para cualquier tabla
-- ----------------------------------------------------------------------------
CREATE TABLE auditoria (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID        NOT NULL REFERENCES usuario(id),
    accion          VARCHAR(20) NOT NULL,   -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT
    tabla_afectada  VARCHAR(50) NOT NULL,
    registro_id     UUID,
    datos_anteriores JSONB,
    datos_nuevos    JSONB,
    ip_address      INET,
    user_agent      TEXT,
    fecha_hora      TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_accion_valida CHECK (
        accion IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','VIEW','EXPORT')
    )
);

COMMENT ON TABLE auditoria IS 'Bitácora de todos los cambios y accesos al sistema (RN-06)';

-- =============================================================================
-- SECCIÓN 7: ÍNDICES PARA RENDIMIENTO
-- =============================================================================

-- Búsqueda de pacientes (operación más frecuente del sistema)
CREATE INDEX idx_paciente_dpi     ON paciente USING btree (dpi);
CREATE INDEX idx_paciente_nombre  ON paciente USING gin (nombre_completo gin_trgm_ops);

-- Vista de agenda (médico + fecha)
CREATE INDEX idx_cita_medico_fecha ON cita (medico_id, fecha_hora_inicio);
CREATE INDEX idx_cita_paciente     ON cita (paciente_id);
CREATE INDEX idx_cita_estado       ON cita (estado);
CREATE INDEX idx_cita_fecha        ON cita (fecha_hora_inicio);

-- Historial de consultas por expediente (más reciente primero)
CREATE INDEX idx_consulta_expediente ON consulta (expediente_id, fecha_hora DESC);
CREATE INDEX idx_consulta_medico     ON consulta (medico_id, fecha_hora DESC);

-- Auditoría por usuario y fecha
CREATE INDEX idx_auditoria_usuario ON auditoria (usuario_id, fecha_hora DESC);
CREATE INDEX idx_auditoria_tabla   ON auditoria (tabla_afectada, fecha_hora DESC);

-- Documentos adjuntos por expediente
CREATE INDEX idx_documento_expediente ON documento_adjunto (expediente_id);

-- =============================================================================
-- SECCIÓN 8: FUNCIONES Y TRIGGERS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Función: actualizar timestamp de modificación
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en expediente
CREATE TRIGGER trg_expediente_actualizado
    BEFORE UPDATE ON expediente
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- ----------------------------------------------------------------------------
-- Función: sincronizar flag tiene_alergias en expediente
-- Cuando se actualiza el campo alergias, actualiza el flag automáticamente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_flag_alergias()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.alergias IS NOT NULL AND trim(NEW.alergias) != '' THEN
        NEW.tiene_alergias = TRUE;
    ELSE
        NEW.tiene_alergias = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_alergias
    BEFORE INSERT OR UPDATE OF alergias ON expediente
    FOR EACH ROW EXECUTE FUNCTION fn_sync_flag_alergias();

-- ----------------------------------------------------------------------------
-- Función: validar que solo médicos tengan citas asignadas
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validar_rol_medico()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT rol FROM usuario WHERE id = NEW.medico_id) != 'medico' THEN
        RAISE EXCEPTION 'El usuario asignado como médico debe tener rol médico. ID: %', NEW.medico_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_medico_cita
    BEFORE INSERT OR UPDATE ON cita
    FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_medico();

CREATE TRIGGER trg_validar_medico_consulta
    BEFORE INSERT OR UPDATE ON consulta
    FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_medico();

-- ----------------------------------------------------------------------------
-- Función: validar que solo enfermeras registren signos vitales
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validar_rol_enfermera()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT rol FROM usuario WHERE id = NEW.enfermera_id) NOT IN ('enfermera', 'medico') THEN
        RAISE EXCEPTION 'Solo enfermeras o médicos pueden registrar signos vitales';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_enfermera_signos
    BEFORE INSERT ON signos_vitales
    FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_enfermera();

-- =============================================================================
-- SECCIÓN 9: DATOS INICIALES (SEED)
-- =============================================================================

-- Especialidades médicas
INSERT INTO especialidad (nombre, descripcion) VALUES
    ('Medicina General',    'Atención médica primaria y preventiva'),
    ('Pediatría',           'Atención médica para niños y adolescentes'),
    ('Ginecología',         'Salud del sistema reproductivo femenino'),
    ('Cardiología',         'Enfermedades del corazón y sistema cardiovascular'),
    ('Traumatología',       'Lesiones del sistema músculo-esquelético'),
    ('Dermatología',        'Enfermedades de la piel'),
    ('Psiquiatría',         'Salud mental y trastornos psiquiátricos'),
    ('Neurología',          'Enfermedades del sistema nervioso'),
    ('Endocrinología',      'Trastornos hormonales y metabólicos'),
    ('Oftalmología',        'Enfermedades de los ojos');

-- Tipos de consulta
INSERT INTO tipo_consulta (nombre, descripcion, duracion_minutos) VALUES
    ('Primera consulta',    'Primera visita del paciente a la clínica',        45),
    ('Consulta de control', 'Seguimiento de diagnóstico o tratamiento previo', 30),
    ('Emergencia',          'Atención urgente fuera de cita programada',       20),
    ('Revisión de resultados', 'Revisión de laboratorio o estudios',           20),
    ('Consulta preventiva', 'Chequeo general sin síntomas específicos',        40);

-- Usuario administrador por defecto
-- IMPORTANTE: cambiar la contraseña en el primer acceso
-- Password: Admin@Clinica2025 (hash bcrypt incluido solo como ejemplo)
INSERT INTO usuario (
    nombre_completo,
    email,
    password_hash,
    rol
) VALUES (
    'Administrador del Sistema',
    'admin@clinica.gt',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhCangelFkc5JpRWb44jJW',
    'administrador'
);

-- =============================================================================
-- SECCIÓN 10: VISTAS ÚTILES
-- =============================================================================

-- Vista: agenda del día con datos completos
CREATE VIEW v_agenda_dia AS
SELECT
    c.id                    AS cita_id,
    c.fecha_hora_inicio,
    c.fecha_hora_fin,
    c.estado,
    p.nombre_completo       AS paciente_nombre,
    p.dpi                   AS paciente_dpi,
    p.telefono              AS paciente_telefono,
    u.nombre_completo       AS medico_nombre,
    tc.nombre               AS tipo_consulta,
    sv.presion_arterial,
    sv.temperatura_c,
    e.tiene_alergias,
    e.alergias
FROM cita c
JOIN paciente p          ON c.paciente_id      = p.id
JOIN usuario u           ON c.medico_id        = u.id
JOIN tipo_consulta tc    ON c.tipo_consulta_id = tc.id
LEFT JOIN signos_vitales sv ON sv.cita_id      = c.id
LEFT JOIN expediente e   ON e.paciente_id      = p.id
WHERE DATE(c.fecha_hora_inicio) = CURRENT_DATE
  AND c.estado NOT IN ('cancelada', 'no_presentada')
ORDER BY c.fecha_hora_inicio;

COMMENT ON VIEW v_agenda_dia IS 'Agenda del día con datos de paciente, médico y signos vitales';

-- Vista: resumen de expediente para app móvil (solo lectura, datos críticos)
CREATE VIEW v_expediente_emergencia AS
SELECT
    p.id                        AS paciente_id,
    p.nombre_completo,
    p.dpi,
    p.fecha_nacimiento,
    p.sexo,
    p.telefono,
    p.contacto_emergencia,
    p.telefono_emergencia,
    e.tipo_sangre,
    e.tiene_alergias,
    e.alergias,
    e.enfermedades_cronicas,
    e.medicamentos_permanentes,
    e.antecedentes_quirurgicos,
    (
        SELECT COUNT(*) FROM consulta co
        JOIN expediente ex ON co.expediente_id = ex.id
        WHERE ex.paciente_id = p.id
    )                           AS total_consultas,
    (
        SELECT co.fecha_hora FROM consulta co
        JOIN expediente ex ON co.expediente_id = ex.id
        WHERE ex.paciente_id = p.id
        ORDER BY co.fecha_hora DESC LIMIT 1
    )                           AS ultima_consulta
FROM paciente p
JOIN expediente e ON e.paciente_id = p.id
WHERE p.activo = TRUE AND e.activo = TRUE;

COMMENT ON VIEW v_expediente_emergencia IS 'Vista optimizada para app móvil — campos críticos de emergencia';

-- Vista: historial de consultas por paciente
CREATE VIEW v_historial_consultas AS
SELECT
    co.id                   AS consulta_id,
    co.fecha_hora,
    co.motivo_consulta,
    co.diagnostico_cie10,
    co.diagnostico_descripcion,
    co.tratamiento,
    co.medicamentos_recetados,
    co.es_emergencia,
    u.nombre_completo       AS medico_nombre,
    es.nombre               AS especialidad,
    sv.presion_arterial,
    sv.temperatura_c,
    sv.peso_kg,
    sv.talla_cm,
    p.id                    AS paciente_id
FROM consulta co
JOIN usuario u          ON co.medico_id      = u.id
JOIN expediente ex      ON co.expediente_id  = ex.id
JOIN paciente p         ON ex.paciente_id    = p.id
LEFT JOIN cita ci       ON co.cita_id        = ci.id
LEFT JOIN signos_vitales sv ON sv.cita_id    = ci.id
LEFT JOIN medico_especialidad me ON me.medico_id = u.id AND me.es_principal = TRUE
LEFT JOIN especialidad es ON es.id = me.especialidad_id
ORDER BY co.fecha_hora DESC;

COMMENT ON VIEW v_historial_consultas IS 'Historial completo de consultas con signos vitales y datos del médico';

-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================

-- Verificación rápida post-creación
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_name = t.table_name
       AND table_schema = 'public') AS columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
