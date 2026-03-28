import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import AlergiasBanner from '../../components/expedientes/AlergiasBanner';
import ModalConsulta from '../../components/expedientes/ModalConsulta';
import api from '../../services/api';

const LABEL_TIPO_SANGRE = {
  A_POS: 'A+', A_NEG: 'A-', B_POS: 'B+', B_NEG: 'B-',
  AB_POS: 'AB+', AB_NEG: 'AB-', O_POS: 'O+', O_NEG: 'O-',
  desconocido: 'Desconocido',
};

const TIPO_SANGRE_OPTS = Object.entries(LABEL_TIPO_SANGRE);

export default function ExpedientePage() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const citaIdParam = searchParams.get('citaId');
  const { usuario } = useAuth();
  const qc = useQueryClient();

  const [modalConsulta, setModalConsulta] = useState(!!citaIdParam);
  const [editandoExpediente, setEditandoExpediente] = useState(false);
  const [formExp, setFormExp] = useState({});

  // Datos del paciente + expediente
  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => api.get(`/pacientes/${pacienteId}`).then(r => r.data),
  });

  // Historial de consultas
  const { data: historial = [] } = useQuery({
    queryKey: ['historial', paciente?.expediente?.id],
    queryFn: () => api.get(`/expedientes/${paciente.expediente.id}/historial`).then(r => r.data),
    enabled: !!paciente?.expediente?.id,
  });

  const mutEditarExp = useMutation({
    mutationFn: (data) => api.patch(`/expedientes/${paciente.expediente.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['paciente', pacienteId]);
      setEditandoExpediente(false);
    },
  });

  if (isLoading) return <p className="text-gray-400 text-sm">Cargando expediente...</p>;
  if (!paciente) return <p className="text-red-500 text-sm">Paciente no encontrado.</p>;

  const exp = paciente.expediente;
  const edad = calcularEdad(paciente.fechaNacimiento);

  function iniciarEdicion() {
    setFormExp({
      tipoSangre: exp.tipoSangre || 'desconocido',
      alergias: exp.alergias || '',
      enfermedadesCronicas: exp.enfermedadesCronicas || '',
      medicamentosPermanentes: exp.medicamentosPermanentes || '',
      antecedentesFamiliares: exp.antecedentesFamiliares || '',
      antecedentesQuirurgicos: exp.antecedentesQuirurgicos || '',
      antecedentesTraumaticos: exp.antecedentesTraumaticos || '',
      observacionesGenerales: exp.observacionesGenerales || '',
    });
    setEditandoExpediente(true);
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/expedientes')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Pacientes
        </button>
      </div>

      {/* Encabezado del paciente */}
      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{paciente.nombreCompleto}</h1>
            <p className="text-sm text-gray-500 mt-1">
              DPI: <span className="font-mono">{paciente.dpi}</span>
              {' · '}{edad} años{' · '}
              <span className="capitalize">{paciente.sexo}</span>
            </p>
            <p className="text-sm text-gray-500">📞 {paciente.telefono}
              {paciente.correo && <span> · ✉️ {paciente.correo}</span>}
            </p>
            {paciente.contactoEmergencia && (
              <p className="text-sm text-orange-600 mt-1">
                🚨 Emergencia: {paciente.contactoEmergencia} {paciente.telefonoEmergencia && `(${paciente.telefonoEmergencia})`}
              </p>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded ${paciente.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {paciente.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Alerta de alergias — SIEMPRE PRIMERO (RF-31) */}
      {exp?.tieneAlergias && <AlergiasBanner alergias={exp.alergias} />}

      {/* Expediente médico */}
      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Expediente médico</h2>
          {!editandoExpediente && (
            <button onClick={iniciarEdicion}
              className="text-sm text-blue-600 hover:underline">
              Editar
            </button>
          )}
        </div>

        {editandoExpediente ? (
          <FormExpediente
            form={formExp}
            onChange={(name, value) => setFormExp(f => ({ ...f, [name]: value }))}
            onGuardar={() => mutEditarExp.mutate(formExp)}
            onCancelar={() => setEditandoExpediente(false)}
            guardando={mutEditarExp.isPending}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Campo label="Tipo de sangre" valor={LABEL_TIPO_SANGRE[exp?.tipoSangre] || '—'} destacado={exp?.tipoSangre !== 'desconocido'} />
            <Campo label="Enfermedades crónicas" valor={exp?.enfermedadesCronicas} />
            <Campo label="Medicamentos permanentes" valor={exp?.medicamentosPermanentes} />
            <Campo label="Antecedentes familiares" valor={exp?.antecedentesFamiliares} />
            <Campo label="Antecedentes quirúrgicos" valor={exp?.antecedentesQuirurgicos} />
            <Campo label="Antecedentes traumáticos" valor={exp?.antecedentesTraumaticos} />
            <div className="col-span-2">
              <Campo label="Observaciones generales" valor={exp?.observacionesGenerales} />
            </div>
          </div>
        )}
      </div>

      {/* Historial de consultas */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">
            Historial de consultas
            <span className="ml-2 text-xs text-gray-400 font-normal">({historial.length})</span>
          </h2>
          {usuario?.rol === 'medico' && exp?.activo && (
            <button
              onClick={() => setModalConsulta(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded"
            >
              + Nueva consulta
            </button>
          )}
        </div>

        {historial.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Sin consultas registradas.</p>
        ) : (
          <div className="space-y-4">
            {historial.map(c => (
              <TarjetaConsulta key={c.id} consulta={c} />
            ))}
          </div>
        )}
      </div>

      {/* Modal nueva consulta */}
      {modalConsulta && exp && (
        <ModalConsulta
          expedienteId={exp.id}
          citaId={citaIdParam}
          onCerrar={() => setModalConsulta(false)}
        />
      )}
    </div>
  );
}

function TarjetaConsulta({ consulta }) {
  const [expandido, setExpandido] = useState(false);
  const fecha = new Date(consulta.fechaHora).toLocaleString('es-GT');
  const sv = consulta.cita?.signosVitales;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-800 text-sm">{consulta.motivoConsulta}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {fecha} · Dr. {consulta.medico?.nombreCompleto}
            {consulta.esEmergencia && <span className="ml-2 text-orange-500 font-medium">EMERGENCIA</span>}
          </p>
        </div>
        <button onClick={() => setExpandido(e => !e)}
          className="text-xs text-blue-500 hover:underline ml-4 flex-shrink-0">
          {expandido ? 'Ocultar' : 'Ver detalle'}
        </button>
      </div>

      {consulta.diagnosticoCie10 && (
        <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5">
          CIE-10: {consulta.diagnosticoCie10}
        </span>
      )}

      {expandido && (
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
          {consulta.diagnosticoDescripcion && <Campo label="Diagnóstico" valor={consulta.diagnosticoDescripcion} />}
          {consulta.tratamiento && <Campo label="Tratamiento" valor={consulta.tratamiento} />}
          {consulta.medicamentosRecetados && <Campo label="Medicamentos" valor={consulta.medicamentosRecetados} />}
          {consulta.indicacionesGenerales && <div className="col-span-2"><Campo label="Indicaciones" valor={consulta.indicacionesGenerales} /></div>}
          {consulta.proximaCitaDias && <Campo label="Próxima cita" valor={`${consulta.proximaCitaDias} días`} />}
          {sv && (
            <div className="col-span-2 bg-gray-50 rounded p-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">SIGNOS VITALES</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {sv.presionArterial && <span>PA: <b>{sv.presionArterial}</b></span>}
                {sv.temperaturaC && <span>Temp: <b>{sv.temperaturaC}°C</b></span>}
                {sv.pesoKg && <span>Peso: <b>{sv.pesoKg} kg</b></span>}
                {sv.tallaCm && <span>Talla: <b>{sv.tallaCm} cm</b></span>}
                {sv.frecuenciaCardiaca && <span>FC: <b>{sv.frecuenciaCardiaca} lpm</b></span>}
                {sv.saturacionO2 && <span>SpO2: <b>{sv.saturacionO2}%</b></span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormExpediente({ form, onChange, onGuardar, onCancelar, guardando }) {
  const TIPO_SANGRE_OPTS = [
    ['A_POS','A+'],['A_NEG','A-'],['B_POS','B+'],['B_NEG','B-'],
    ['AB_POS','AB+'],['AB_NEG','AB-'],['O_POS','O+'],['O_NEG','O-'],
    ['desconocido','Desconocido'],
  ];

  function handleChange(e) {
    onChange(e.target.name, e.target.value);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de sangre</label>
        <select name="tipoSangre" value={form.tipoSangre} onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-40">
          {TIPO_SANGRE_OPTS.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
        </select>
      </div>
      <TextareaField label="Alergias (dejar vacío para limpiar)" name="alergias" value={form.alergias} onChange={handleChange} />
      <TextareaField label="Enfermedades crónicas" name="enfermedadesCronicas" value={form.enfermedadesCronicas} onChange={handleChange} />
      <TextareaField label="Medicamentos permanentes" name="medicamentosPermanentes" value={form.medicamentosPermanentes} onChange={handleChange} />
      <TextareaField label="Antecedentes familiares" name="antecedentesFamiliares" value={form.antecedentesFamiliares} onChange={handleChange} />
      <TextareaField label="Antecedentes quirúrgicos" name="antecedentesQuirurgicos" value={form.antecedentesQuirurgicos} onChange={handleChange} />
      <TextareaField label="Antecedentes traumáticos" name="antecedentesTraumaticos" value={form.antecedentesTraumaticos} onChange={handleChange} />
      <TextareaField label="Observaciones generales" name="observacionesGenerales" value={form.observacionesGenerales} onChange={handleChange} />
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onGuardar} disabled={guardando}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium">
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onCancelar}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function TextareaField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea name={name} value={value} onChange={onChange} rows={2}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function Campo({ label, valor, destacado = false }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-0.5 ${destacado ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
        {valor || <span className="text-gray-300 italic">—</span>}
      </p>
    </div>
  );
}

function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}
