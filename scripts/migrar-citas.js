#!/usr/bin/env node
/**
 * migrar-citas.js — Importador CSV de agenda física pendiente al sistema
 *
 * Uso:
 *   node scripts/migrar-citas.js --archivo=./datos/citas.csv [--dry-run]
 *
 * Formato del CSV (ver docs/plantilla-citas.csv):
 *   dpi_paciente, email_medico, fecha (YYYY-MM-DD), hora_inicio (HH:MM),
 *   hora_fin (HH:MM), tipo_consulta, notas_secretaria
 *
 * Reglas:
 *   - El paciente debe existir en la BD (migrarlo antes con migrar-pacientes.js)
 *   - El médico se busca por email
 *   - El tipo de consulta se busca por nombre exacto (case-insensitive)
 *   - Si ya existe una cita para ese médico+fecha+hora, se omite (no duplica)
 *   - Solo se importan citas con fecha >= hoy
 */

'use strict';

const path    = require('path');
const fs      = require('fs');
const readline = require('readline');

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const ADMIN_EMAIL = 'migracion@sistema.interno';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsearCSV(linea) {
  const resultado = [];
  let campo = '';
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (dentroComillas && linea[i + 1] === '"') { campo += '"'; i++; }
      else { dentroComillas = !dentroComillas; }
    } else if (c === ',' && !dentroComillas) {
      resultado.push(campo.trim());
      campo = '';
    } else {
      campo += c;
    }
  }
  resultado.push(campo.trim());
  return resultado;
}

function construirFechaHora(fecha, hora) {
  // fecha: YYYY-MM-DD, hora: HH:MM
  const [y, m, d] = fecha.split('-').map(Number);
  const [h, min]  = hora.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0);
}

async function obtenerAdminId() {
  const admin = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    console.error(`\n✗ No se encontró el usuario de migración (${ADMIN_EMAIL}).`);
    console.error('  Ejecuta primero: node scripts/migrar-pacientes.js --crear-admin\n');
    process.exit(1);
  }
  return admin.id;
}

// Cache para evitar queries repetidas en el mismo lote
const cacheMedicos = {};
const cacheTipos   = {};

async function buscarMedico(email) {
  if (cacheMedicos[email] !== undefined) return cacheMedicos[email];
  const medico = await prisma.usuario.findFirst({
    where: { email: email.toLowerCase(), rol: 'medico', activo: true },
    select: { id: true, nombreCompleto: true },
  });
  cacheMedicos[email] = medico;
  return medico;
}

async function buscarTipoConsulta(nombre) {
  const key = nombre.toLowerCase();
  if (cacheTipos[key] !== undefined) return cacheTipos[key];
  const tipo = await prisma.tipoConsulta.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' }, activo: true },
    select: { id: true, nombre: true },
  });
  cacheTipos[key] = tipo;
  return tipo;
}

// ── Migración principal ───────────────────────────────────────────────────────

async function migrarCitas(archivoCSV, dryRun) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Migración de citas${dryRun ? ' [DRY RUN — sin cambios en BD]' : ''}`);
  console.log(`  Archivo: ${archivoCSV}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (!fs.existsSync(archivoCSV)) {
    console.error(`✗ Archivo no encontrado: ${archivoCSV}`);
    process.exit(1);
  }

  const adminId = await obtenerAdminId();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const rl = readline.createInterface({
    input: fs.createReadStream(archivoCSV, 'utf8'),
    crlfDelay: Infinity,
  });

  let headers  = null;
  let numLinea = 0;
  let creadas  = 0;
  let omitidas = 0;
  let errores  = [];

  for await (const linea of rl) {
    numLinea++;
    if (linea.trim() === '') continue;

    const valores = parsearCSV(linea);

    if (numLinea === 1) {
      headers = valores.map(h => h.toLowerCase().replace(/\s+/g, '_'));
      console.log(`  Columnas detectadas: ${headers.join(', ')}\n`);
      continue;
    }

    const fila = {};
    headers.forEach((h, i) => { fila[h] = valores[i] || ''; });

    // Validaciones básicas
    const erroresFila = [];
    if (!fila.dpi_paciente)   erroresFila.push('dpi_paciente requerido');
    if (!fila.email_medico)   erroresFila.push('email_medico requerido');
    if (!fila.fecha)          erroresFila.push('fecha requerida (YYYY-MM-DD)');
    if (!fila.hora_inicio)    erroresFila.push('hora_inicio requerida (HH:MM)');
    if (!fila.hora_fin)       erroresFila.push('hora_fin requerida (HH:MM)');
    if (!fila.tipo_consulta)  erroresFila.push('tipo_consulta requerido');

    if (erroresFila.length > 0) {
      errores.push({ linea: numLinea, errores: erroresFila });
      console.log(`  ✗ Línea ${numLinea}: ${erroresFila.join('; ')}`);
      continue;
    }

    const fechaInicio = construirFechaHora(fila.fecha, fila.hora_inicio);
    const fechaFin    = construirFechaHora(fila.fecha, fila.hora_fin);

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      errores.push({ linea: numLinea, errores: ['fecha/hora inválida'] });
      console.log(`  ✗ Línea ${numLinea}: fecha u hora con formato inválido`);
      continue;
    }

    if (fechaInicio < hoy) {
      console.log(`  ~ Línea ${numLinea}: omitida — fecha pasada (${fila.fecha})`);
      omitidas++;
      continue;
    }

    if (dryRun) {
      console.log(`  ~ Línea ${numLinea}: ${fila.dpi_paciente} con ${fila.email_medico} el ${fila.fecha} ${fila.hora_inicio} [simulado]`);
      creadas++;
      continue;
    }

    try {
      // Buscar paciente
      const dpi = fila.dpi_paciente.replace(/\s/g, '');
      const paciente = await prisma.paciente.findUnique({
        where: { dpi },
        select: { id: true, nombreCompleto: true },
      });
      if (!paciente) {
        errores.push({ linea: numLinea, errores: [`Paciente con DPI ${dpi} no encontrado`] });
        console.log(`  ✗ Línea ${numLinea}: Paciente DPI ${dpi} no existe en BD`);
        continue;
      }

      // Buscar médico
      const medico = await buscarMedico(fila.email_medico.trim());
      if (!medico) {
        errores.push({ linea: numLinea, errores: [`Médico ${fila.email_medico} no encontrado`] });
        console.log(`  ✗ Línea ${numLinea}: Médico ${fila.email_medico} no existe`);
        continue;
      }

      // Buscar tipo de consulta
      const tipoConsulta = await buscarTipoConsulta(fila.tipo_consulta.trim());
      if (!tipoConsulta) {
        errores.push({ linea: numLinea, errores: [`Tipo de consulta '${fila.tipo_consulta}' no encontrado`] });
        console.log(`  ✗ Línea ${numLinea}: Tipo consulta '${fila.tipo_consulta}' no existe`);
        continue;
      }

      // Verificar conflicto de horario (RN-01)
      const conflicto = await prisma.cita.findFirst({
        where: {
          medicoId: medico.id,
          fechaHoraInicio: fechaInicio,
          estado: { notIn: ['cancelada', 'no_presentada'] },
        },
      });
      if (conflicto) {
        console.log(`  ~ Línea ${numLinea}: omitida — horario ocupado (${fila.fecha} ${fila.hora_inicio})`);
        omitidas++;
        continue;
      }

      // Crear cita
      await prisma.cita.create({
        data: {
          pacienteId:     paciente.id,
          medicoId:       medico.id,
          tipoConsultaId: tipoConsulta.id,
          fechaHoraInicio: fechaInicio,
          fechaHoraFin:    fechaFin,
          estado:          'pendiente',
          notasSecretaria: fila.notas_secretaria?.trim() || null,
          creadoPorId:     adminId,
        },
      });

      console.log(`  ✓ Línea ${numLinea}: ${paciente.nombreCompleto} — ${fila.fecha} ${fila.hora_inicio} con ${medico.nombreCompleto}`);
      creadas++;
    } catch (err) {
      errores.push({ linea: numLinea, errores: [err.message] });
      console.log(`  ✗ Línea ${numLinea}: ${err.message}`);
    }
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Resumen${dryRun ? ' (simulación)' : ''}`);
  console.log(`  ✓ Citas creadas: ${creadas}`);
  console.log(`  ~ Omitidas:      ${omitidas}`);
  console.log(`  ✗ Errores:       ${errores.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (errores.length > 0) {
    const logPath = path.join(__dirname, `../migración-citas-errores-${Date.now()}.log`);
    fs.writeFileSync(logPath, JSON.stringify(errores, null, 2), 'utf8');
    console.log(`  Errores guardados en: ${logPath}\n`);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const archivoArg = args.find(a => a.startsWith('--archivo='));

  if (!archivoArg) {
    console.error('Uso: node scripts/migrar-citas.js --archivo=./datos/citas.csv [--dry-run]');
    process.exit(1);
  }

  const archivoCSV = path.resolve(archivoArg.split('=')[1]);
  const dryRun = args.includes('--dry-run');

  try {
    await migrarCitas(archivoCSV, dryRun);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('\n✗ Error fatal:', err.message);
  prisma.$disconnect();
  process.exit(1);
});
