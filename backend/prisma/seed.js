const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Especialidades ─────────────────────────────────────────────────────────
  const especialidades = await Promise.all([
    prisma.especialidad.upsert({
      where: { nombre: 'Medicina General' },
      update: {},
      create: { nombre: 'Medicina General', descripcion: 'Atención primaria y consulta general' },
    }),
    prisma.especialidad.upsert({
      where: { nombre: 'Pediatría' },
      update: {},
      create: { nombre: 'Pediatría', descripcion: 'Atención médica a niños y adolescentes' },
    }),
    prisma.especialidad.upsert({
      where: { nombre: 'Ginecología' },
      update: {},
      create: { nombre: 'Ginecología', descripcion: 'Salud reproductiva femenina' },
    }),
    prisma.especialidad.upsert({
      where: { nombre: 'Cardiología' },
      update: {},
      create: { nombre: 'Cardiología', descripcion: 'Enfermedades del corazón y sistema cardiovascular' },
    }),
  ]);
  console.log(`✓ ${especialidades.length} especialidades`);

  // ── Tipos de consulta ──────────────────────────────────────────────────────
  const tiposConsulta = await Promise.all([
    prisma.tipoConsulta.upsert({
      where: { nombre: 'Consulta general' },
      update: {},
      create: { nombre: 'Consulta general', descripcion: 'Consulta médica estándar', duracionMinutos: 30 },
    }),
    prisma.tipoConsulta.upsert({
      where: { nombre: 'Control' },
      update: {},
      create: { nombre: 'Control', descripcion: 'Seguimiento de tratamiento', duracionMinutos: 20 },
    }),
    prisma.tipoConsulta.upsert({
      where: { nombre: 'Emergencia' },
      update: {},
      create: { nombre: 'Emergencia', descripcion: 'Atención de urgencia', duracionMinutos: 45 },
    }),
    prisma.tipoConsulta.upsert({
      where: { nombre: 'Primera vez' },
      update: {},
      create: { nombre: 'Primera vez', descripcion: 'Consulta inicial del paciente', duracionMinutos: 45 },
    }),
    prisma.tipoConsulta.upsert({
      where: { nombre: 'Chequeo general' },
      update: {},
      create: { nombre: 'Chequeo general', descripcion: 'Examen médico preventivo', duracionMinutos: 60 },
    }),
  ]);
  console.log(`✓ ${tiposConsulta.length} tipos de consulta`);

  // ── Catálogo CIE-10 básico (RF-29) ────────────────────────────────────────
  // Los 10 diagnósticos más frecuentes en clínica general
  const cie10 = [
    { codigo: 'J06.9', descripcion: 'Infección aguda de las vías respiratorias superiores' },
    { codigo: 'J18.9', descripcion: 'Neumonía, no especificada' },
    { codigo: 'K59.0', descripcion: 'Estreñimiento' },
    { codigo: 'I10',   descripcion: 'Hipertensión esencial (primaria)' },
    { codigo: 'E11.9', descripcion: 'Diabetes mellitus tipo 2 sin complicaciones' },
    { codigo: 'K29.7', descripcion: 'Gastritis, no especificada' },
    { codigo: 'M54.5', descripcion: 'Lumbago no especificado' },
    { codigo: 'J00',   descripcion: 'Rinofaringitis aguda (resfriado común)' },
    { codigo: 'A09',   descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso' },
    { codigo: 'N39.0', descripcion: 'Infección de vías urinarias, sitio no especificado' },
  ];
  // CIE-10 se referencia en campo texto libre de Consulta — no tiene tabla propia,
  // se guarda como seed comentado para que el frontend ofrezca sugerencias.
  console.log(`✓ ${cie10.length} códigos CIE-10 referenciados (uso en campo libre de consultas)`);

  // ── Usuarios ───────────────────────────────────────────────────────────────
  const hash = (pwd) => bcrypt.hash(pwd, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@clinica.gt' },
    update: {},
    create: {
      nombreCompleto: 'Administrador Sistema',
      email: 'admin@clinica.gt',
      passwordHash: await hash('Admin1234!'),
      rol: 'administrador',
      telefono: '55550000',
    },
  });

  const medico1 = await prisma.usuario.upsert({
    where: { email: 'dr.garcia@clinica.gt' },
    update: {},
    create: {
      nombreCompleto: 'Carlos García López',
      email: 'dr.garcia@clinica.gt',
      passwordHash: await hash('Medico1234!'),
      rol: 'medico',
      numeroColegiado: 'COL-1001',
      telefono: '55551001',
      creadoPorId: admin.id,
    },
  });

  const medico2 = await prisma.usuario.upsert({
    where: { email: 'dra.martinez@clinica.gt' },
    update: {},
    create: {
      nombreCompleto: 'Ana Martínez Pérez',
      email: 'dra.martinez@clinica.gt',
      passwordHash: await hash('Medico1234!'),
      rol: 'medico',
      numeroColegiado: 'COL-1002',
      telefono: '55551002',
      creadoPorId: admin.id,
    },
  });

  const enfermera = await prisma.usuario.upsert({
    where: { email: 'enfermera@clinica.gt' },
    update: {},
    create: {
      nombreCompleto: 'María López Sánchez',
      email: 'enfermera@clinica.gt',
      passwordHash: await hash('Enfermera1234!'),
      rol: 'enfermera',
      telefono: '55552001',
      creadoPorId: admin.id,
    },
  });

  const secretaria = await prisma.usuario.upsert({
    where: { email: 'secretaria@clinica.gt' },
    update: {},
    create: {
      nombreCompleto: 'Laura Ramírez Cruz',
      email: 'secretaria@clinica.gt',
      passwordHash: await hash('Secretaria1234!'),
      rol: 'secretaria',
      telefono: '55553001',
      creadoPorId: admin.id,
    },
  });

  console.log(`✓ 5 usuarios (admin, 2 médicos, enfermera, secretaria)`);

  // ── Especialidades de médicos ──────────────────────────────────────────────
  await prisma.medicoEspecialidad.upsert({
    where: { medicoId_especialidadId: { medicoId: medico1.id, especialidadId: especialidades[0].id } },
    update: {},
    create: { medicoId: medico1.id, especialidadId: especialidades[0].id, esPrincipal: true },
  });
  await prisma.medicoEspecialidad.upsert({
    where: { medicoId_especialidadId: { medicoId: medico2.id, especialidadId: especialidades[2].id } },
    update: {},
    create: { medicoId: medico2.id, especialidadId: especialidades[2].id, esPrincipal: true },
  });
  console.log(`✓ Especialidades asignadas a médicos`);

  // ── Pacientes + Expedientes ────────────────────────────────────────────────
  const pacientesData = [
    {
      nombreCompleto: 'Roberto Sánchez Méndez',
      dpi: '1234567890101',
      fechaNacimiento: new Date('1985-03-15'),
      sexo: 'masculino',
      telefono: '55561001',
      correo: 'roberto@email.com',
      contactoEmergencia: 'María Sánchez',
      telefonoEmergencia: '55561002',
      expediente: {
        tipoSangre: 'O_POS',
        alergias: 'Penicilina, Ibuprofeno',
        tieneAlergias: true,
        enfermedadesCronicas: 'Hipertensión arterial',
        medicamentosPermanentes: 'Losartán 50mg',
      },
    },
    {
      nombreCompleto: 'Ana Lucía Flores Torres',
      dpi: '2345678901202',
      fechaNacimiento: new Date('1992-07-22'),
      sexo: 'femenino',
      telefono: '55562001',
      correo: 'ana.flores@email.com',
      expediente: {
        tipoSangre: 'A_POS',
        tieneAlergias: false,
      },
    },
    {
      nombreCompleto: 'Pedro José Castillo Ruiz',
      dpi: '3456789012303',
      fechaNacimiento: new Date('1978-11-08'),
      sexo: 'masculino',
      telefono: '55563001',
      contactoEmergencia: 'Carmen Castillo',
      telefonoEmergencia: '55563002',
      seguroMedico: 'Seguros Guatemala',
      numeroPoliza: 'POL-45678',
      expediente: {
        tipoSangre: 'B_POS',
        tieneAlergias: false,
        enfermedadesCronicas: 'Diabetes tipo 2',
        medicamentosPermanentes: 'Metformina 850mg, Glibenclamida 5mg',
        antecedentesFamiliares: 'Padre con diabetes e hipertensión',
      },
    },
    {
      nombreCompleto: 'Carmen Rosa López Vega',
      dpi: '4567890123404',
      fechaNacimiento: new Date('2001-05-30'),
      sexo: 'femenino',
      telefono: '55564001',
      expediente: {
        tipoSangre: 'AB_NEG',
        tieneAlergias: false,
      },
    },
    {
      nombreCompleto: 'Miguel Ángel Pérez Herrera',
      dpi: '5678901234505',
      fechaNacimiento: new Date('1965-09-12'),
      sexo: 'masculino',
      telefono: '55565001',
      correo: 'miguel.perez@email.com',
      contactoEmergencia: 'Rosa Pérez',
      telefonoEmergencia: '55565002',
      expediente: {
        tipoSangre: 'O_NEG',
        alergias: 'Sulfonamidas',
        tieneAlergias: true,
        enfermedadesCronicas: 'Hiperlipidemia',
        medicamentosPermanentes: 'Atorvastatina 20mg',
        antecedentesQuirurgicos: 'Apendicectomía 2005',
      },
    },
  ];

  for (const data of pacientesData) {
    const { expediente: expData, ...pacData } = data;
    const existing = await prisma.paciente.findUnique({ where: { dpi: pacData.dpi } });
    if (!existing) {
      const paciente = await prisma.paciente.create({
        data: { ...pacData, creadoPorId: secretaria.id },
      });
      await prisma.expediente.create({
        data: { pacienteId: paciente.id, creadoPorId: secretaria.id, ...expData },
      });
    }
  }
  console.log(`✓ ${pacientesData.length} pacientes con expedientes`);

  // ── Citas para hoy ─────────────────────────────────────────────────────────
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pacientes = await prisma.paciente.findMany({ take: 3 });
  const tipoGeneral = tiposConsulta[0];

  if (pacientes.length >= 3) {
    const citasData = [
      { hora: 9, min: 0,  duracion: 30, estado: 'confirmada',  paciente: pacientes[0], medico: medico1 },
      { hora: 9, min: 30, duracion: 30, estado: 'pendiente',   paciente: pacientes[1], medico: medico1 },
      { hora: 10, min: 0, duracion: 45, estado: 'pendiente',   paciente: pacientes[2], medico: medico2 },
    ];

    for (const c of citasData) {
      const inicio = new Date(hoy);
      inicio.setHours(c.hora, c.min, 0, 0);
      const fin = new Date(inicio);
      fin.setMinutes(fin.getMinutes() + c.duracion);

      const existe = await prisma.cita.findFirst({
        where: { medicoId: c.medico.id, fechaHoraInicio: inicio },
      });
      if (!existe) {
        await prisma.cita.create({
          data: {
            pacienteId: c.paciente.id,
            medicoId: c.medico.id,
            tipoConsultaId: tipoGeneral.id,
            fechaHoraInicio: inicio,
            fechaHoraFin: fin,
            estado: c.estado,
            creadoPorId: secretaria.id,
          },
        });
      }
    }
    console.log(`✓ Citas de ejemplo para hoy`);
  }

  console.log('\n✅ Seed completado.');
  console.log('─────────────────────────────────');
  console.log('Credenciales:');
  console.log('  admin@clinica.gt        Admin1234!');
  console.log('  dr.garcia@clinica.gt    Medico1234!');
  console.log('  dra.martinez@clinica.gt Medico1234!');
  console.log('  enfermera@clinica.gt    Enfermera1234!');
  console.log('  secretaria@clinica.gt   Secretaria1234!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
