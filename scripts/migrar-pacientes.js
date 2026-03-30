#!/usr/bin/env node
/**
 * migrar-pacientes.js — Importador CSV de expedientes físicos al sistema
 *
 * Uso:
 *   node scripts/migrar-pacientes.js --archivo=./datos/pacientes.csv [--dry-run]
 *
 * Requisitos previos:
 *   1. Archivo .env en /backend/.env con DATABASE_URL configurada
 *   2. Prisma client generado (npx prisma generate desde /backend)
 *   3. Usuario "admin-migracion" en la BD (ver abajo)
 *
 * Crear usuario admin para la migración (ejecutar UNA sola vez):
 *   node scripts/migrar-pacientes.js --crear-admin
 *
 * Formato del CSV (ver docs/plantilla-pacientes.csv):
 *   nombre_completo, dpi, fecha_nacimiento (YYYY-MM-DD), sexo, telefono,
 *   telefono_emergencia, contacto_emergencia, direccion, correo,
 *   tipo_sangre, alergias, enfermedades_cronicas, medicamentos_permanentes,
 *   antecedentes_familiares, antecedentes_quirurgicos, seguro_medico,
 *   numero_poliza, observaciones
 *
 * El script es idempotente: si el DPI ya existe, actualiza en lugar de duplicar.
 */

'use strict';

const path  = require('path');
const fs    = require('fs');
const readline = require('readline');

// Cargar .env desde /backend
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

// ── Constantes ────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'migracion@sistema.interno';
const COLUMNAS_REQUERIDAS = ['nombre_completo', 'dpi', 'fecha_nacimiento', 'sexo', 'telefono'];

const TIPO_SANGRE_MAP = {
  'A+': 'A_POS', 'A-': 'A_NEG',
  'B+': 'B_POS', 'B-': 'B_NEG',
  'AB+': 'AB_POS', 'AB-': 'AB_NEG',
  'O+': 'O_POS', 'O-': 'O_NEG',
  '': 'desconocido',
};

const SEXO_MAP = {
  'masculino': 'masculino', 'M': 'masculino', 'm': 'masculino',
  'femenino':  'femenino',  'F': 'femenino',  'f': 'femenino',
  'otro':      'otro',
};

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

function normalizar(valor) {
  return (valor || '').trim() || null;
}

function validarFila(fila, headers, numLinea) {
  const errores = [];
  for (const col of COLUMNAS_REQUERIDAS) {
    if (!fila[col] || fila[col].trim() === '') {
      errores.push(`Columna '${col}' vacía`);
    }
  }
  if (fila.dpi && !/^\d{13}$/.test(fila.dpi.replace(/\s/g, ''))) {
    errores.push(`DPI inválido (debe tener 13 dígitos): ${fila.dpi}`);
  }
  if (fila.fecha_nacimiento && isNaN(Date.parse(fila.fecha_nacimiento))) {
    errores.push(`fecha_nacimiento inválida: ${fila.fecha_nacimiento}`);
  }
  if (fila.sexo && !SEXO_MAP[fila.sexo]) {
    errores.push(`sexo inválido: '${fila.sexo}' (use masculino/femenino/otro o M/F)`);
  }
  return errores;
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

async function crearAdminMigracion() {
  const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
  const existe = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existe) {
    console.log(`✓ Usuario de migración ya existe (id: ${existe.id})`);
    return;
  }
  const usuario = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Sistema de Migración',
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash('MIGRACIÓN-NO-LOGIN-' + Date.now(), 12),
      rol: 'administrador',
      activo: false,  // No puede hacer login
    },
  });
  console.log(`✓ Usuario de migración creado (id: ${usuario.id})`);
  console.log('  Este usuario está desactivado y no puede hacer login.');
}

// ── Migración principal ───────────────────────────────────────────────────────

async function migrarPacientes(archivoCSV, dryRun) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Migración de pacientes${dryRun ? ' [DRY RUN — sin cambios en BD]' : ''}`);
  console.log(`  Archivo: ${archivoCSV}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (!fs.existsSync(archivoCSV)) {
    console.error(`✗ Archivo no encontrado: ${archivoCSV}`);
    process.exit(1);
  }

  const adminId = await obtenerAdminId();

  const rl = readline.createInterface({
    input: fs.createReadStream(archivoCSV, 'utf8'),
    crlfDelay: Infinity,
  });

  let headers = null;
  let numLinea = 0;
  let creados = 0;
  let actualizados = 0;
  let errores = [];

  for await (const linea of rl) {
    numLinea++;
    if (linea.trim() === '') continue;

    const valores = parsearCSV(linea);

    // Primera línea = encabezados
    if (numLinea === 1) {
      headers = valores.map(h => h.toLowerCase().replace(/\s+/g, '_'));
      console.log(`  Columnas detectadas: ${headers.join(', ')}\n`);
      continue;
    }

    // Mapear valores a objeto
    const fila = {};
    headers.forEach((h, i) => { fila[h] = valores[i] || ''; });

    // Validar
    const erroresFila = validarFila(fila, headers, numLinea);
    if (erroresFila.length > 0) {
      errores.push({ linea: numLinea, dpi: fila.dpi || '?', errores: erroresFila });
      console.log(`  ✗ Línea ${numLinea} (DPI ${fila.dpi || '?'}): ${erroresFila.join('; ')}`);
      continue;
    }

    const dpi = fila.dpi.replace(/\s/g, '');
    const tipoSangre = TIPO_SANGRE_MAP[fila.tipo_sangre] || 'desconocido';
    const sexo = SEXO_MAP[fila.sexo];
    const tieneAlergias = !!(fila.alergias && fila.alergias.trim());

    const datosPaciente = {
      nombreCompleto:     fila.nombre_completo.trim(),
      dpi,
      fechaNacimiento:    new Date(fila.fecha_nacimiento),
      sexo,
      telefono:           fila.telefono.trim(),
      telefonoEmergencia: normalizar(fila.telefono_emergencia),
      contactoEmergencia: normalizar(fila.contacto_emergencia),
      direccion:          normalizar(fila.direccion),
      correo:             normalizar(fila.correo),
      seguroMedico:       normalizar(fila.seguro_medico),
      numeroPoliza:       normalizar(fila.numero_poliza),
    };

    const datosExpediente = {
      tipoSangre,
      alergias:                normalizar(fila.alergias),
      tieneAlergias,
      enfermedadesCronicas:    normalizar(fila.enfermedades_cronicas),
      medicamentosPermanentes: normalizar(fila.medicamentos_permanentes),
      antecedentesFamiliares:  normalizar(fila.antecedentes_familiares),
      antecedentesQuirurgicos: normalizar(fila.antecedentes_quirurgicos),
      observacionesGenerales:  normalizar(fila.observaciones),
    };

    if (dryRun) {
      console.log(`  ~ Línea ${numLinea}: ${datosPaciente.nombreCompleto} (DPI: ${dpi}) [simulado]`);
      creados++;
      continue;
    }

    try {
      const existe = await prisma.paciente.findUnique({ where: { dpi } });

      if (existe) {
        // Actualizar paciente + expediente existente
        await prisma.paciente.update({ where: { dpi }, data: datosPaciente });
        await prisma.expediente.upsert({
          where: { pacienteId: existe.id },
          update: { ...datosExpediente, actualizadoPorId: adminId },
          create: { pacienteId: existe.id, ...datosExpediente, creadoPorId: adminId },
        });
        console.log(`  ↻ Línea ${numLinea}: ${datosPaciente.nombreCompleto} (DPI: ${dpi}) — actualizado`);
        actualizados++;
      } else {
        // Crear paciente + expediente nuevos
        const paciente = await prisma.paciente.create({
          data: { ...datosPaciente, creadoPorId: adminId },
        });
        await prisma.expediente.create({
          data: { pacienteId: paciente.id, ...datosExpediente, creadoPorId: adminId },
        });
        console.log(`  ✓ Línea ${numLinea}: ${datosPaciente.nombreCompleto} (DPI: ${dpi}) — creado`);
        creados++;
      }
    } catch (err) {
      errores.push({ linea: numLinea, dpi, errores: [err.message] });
      console.log(`  ✗ Línea ${numLinea} (DPI ${dpi}): ${err.message}`);
    }
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Resumen${dryRun ? ' (simulación)' : ''}`);
  console.log(`  ✓ Creados:      ${creados}`);
  console.log(`  ↻ Actualizados: ${actualizados}`);
  console.log(`  ✗ Errores:      ${errores.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (errores.length > 0) {
    const logPath = path.join(__dirname, `../migración-errores-${Date.now()}.log`);
    fs.writeFileSync(logPath, JSON.stringify(errores, null, 2), 'utf8');
    console.log(`  Errores guardados en: ${logPath}\n`);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--crear-admin')) {
    await crearAdminMigracion();
    await prisma.$disconnect();
    return;
  }

  const archivoArg = args.find(a => a.startsWith('--archivo='));
  if (!archivoArg) {
    console.error('Uso: node scripts/migrar-pacientes.js --archivo=./datos/pacientes.csv [--dry-run]');
    process.exit(1);
  }

  const archivoCSV = path.resolve(archivoArg.split('=')[1]);
  const dryRun = args.includes('--dry-run');

  try {
    await migrarPacientes(archivoCSV, dryRun);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('\n✗ Error fatal:', err.message);
  prisma.$disconnect();
  process.exit(1);
});
