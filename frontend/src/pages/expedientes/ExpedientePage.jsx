import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft, Phone, Mail, MapPin, Shield, AlertTriangle,
  ChevronDown, ChevronUp, Pencil, Plus, X, Check,
} from 'lucide-react';
import AlergiasBanner from '../../components/expedientes/AlergiasBanner';
import ModalConsulta from '../../components/expedientes/ModalConsulta';
import api from '../../services/api';

const LABEL_TIPO_SANGRE = {
  A_POS: 'A+', A_NEG: 'A-', B_POS: 'B+', B_NEG: 'B-',
  AB_POS: 'AB+', AB_NEG: 'AB-', O_POS: 'O+', O_NEG: 'O-',
  desconocido: '—',
};

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const labelCls = 'block text-xs font-medium text-slate-500 mb-1.5';

function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

export default function ExpedientePage() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const citaIdParam = searchParams.get('citaId');
  const { usuario } = useAuth();
  const qc = useQueryClient();

  const [modalConsulta, setModalConsulta]           = useState(!!citaIdParam);
  const [editandoExpediente, setEditandoExpediente] = useState(false);
  const [editandoPaciente, setEditandoPaciente]     = useState(false);
  const [formExp, setFormExp] = useState({});
  const [formPac, setFormPac] = useState({});

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => api.get(`/pacientes/${pacienteId}`).then(r => r.data),
  });

  const { data: historial = [] } = useQuery({
    queryKey: ['historial', paciente?.expediente?.id],
    queryFn: () => api.get(`/expedientes/${paciente.expediente.id}/historial`).then(r => r.data),
    enabled: !!paciente?.expediente?.id,
  });

  const mutEditarExp = useMutation({
    mutationFn: (data) => api.patch(`/expedientes/${paciente.expediente.id}`, data),
    onSuccess: () => { qc.invalidateQueries(['paciente', pacienteId]); setEditandoExpediente(false); },
  });

  const mutEditarPac = useMutation({
    mutationFn: (data) => api.patch(`/pacientes/${pacienteId}`, data),
    onSuccess: () => { qc.invalidateQueries(['paciente', pacienteId]); setEditandoPaciente(false); },
  });

  if (isLoading) return <p className="text-sm text-slate-400 p-6">Cargando expediente...</p>;
  if (!paciente) return <p className="text-sm text-red-500 p-6">Paciente no encontrado.</p>;

  const exp = paciente.expediente;
  const edad = calcularEdad(paciente.fechaNacimiento);

  function iniciarEdicionPaciente() {
    setFormPac({
      telefono:           paciente.telefono || '',
      correo:             paciente.correo || '',
      direccion:          paciente.direccion || '',
      contactoEmergencia: paciente.contactoEmergencia || '',
      telefonoEmergencia: paciente.telefonoEmergencia || '',
      seguroMedico:       paciente.seguroMedico || '',
      numeroPoliza:       paciente.numeroPoliza || '',
    });
    setEditandoPaciente(true);
  }

  function iniciarEdicionExp() {
    setFormExp({
      tipoSangre:              exp.tipoSangre || 'desconocido',
      alergias:                exp.alergias || '',
      enfermedadesCronicas:    exp.enfermedadesCronicas || '',
      medicamentosPermanentes: exp.medicamentosPermanentes || '',
      antecedentesFamiliares:  exp.antecedentesFamiliares || '',
      antecedentesQuirurgicos: exp.antecedentesQuirurgicos || '',
      antecedentesTraumaticos: exp.antecedentesTraumaticos || '',
      observacionesGenerales:  exp.observacionesGenerales || '',
    });
    setEditandoExpediente(true);
  }

  return (
    <div className="max-w-3xl space-y-4">

      {/* Back */}
      <button
        onClick={() => navigate('/expedientes')}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Pacientes
      </button>

      {/* Header del paciente */}
      <div className="bg-white border border-slate-100 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-semibold flex-shrink-0">
              {iniciales(paciente.nombreCompleto)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-slate-900">{paciente.nombreCompleto}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  paciente.activo
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {paciente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5 capitalize">
                {edad} años · {paciente.sexo} · DPI: <span className="font-mono">{paciente.dpi}</span>
              </p>

              {/* Contacto */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {paciente.telefono && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <Phone className="w-3 h-3" />
                    {paciente.telefono}
                  </span>
                )}
                {paciente.correo && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <Mail className="w-3 h-3" />
                    {paciente.correo}
                  </span>
                )}
                {paciente.direccion && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <MapPin className="w-3 h-3" />
                    {paciente.direccion}
                  </span>
                )}
                {paciente.seguroMedico && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <Shield className="w-3 h-3" />
                    {paciente.seguroMedico}
                    {paciente.numeroPoliza && ` · ${paciente.numeroPoliza}`}
                  </span>
                )}
              </div>

              {/* Contacto de emergencia */}
              {paciente.contactoEmergencia && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Emergencia: {paciente.contactoEmergencia}
                  {paciente.telefonoEmergencia && ` · ${paciente.telefonoEmergencia}`}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={editandoPaciente ? () => setEditandoPaciente(false) : iniciarEdicionPaciente}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            {editandoPaciente ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {editandoPaciente ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {/* Form editar paciente */}
        {editandoPaciente && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Teléfono', key: 'telefono' },
                { label: 'Correo', key: 'correo' },
                { label: 'Dirección', key: 'direccion' },
                { label: 'Contacto de emergencia', key: 'contactoEmergencia' },
                { label: 'Teléfono de emergencia', key: 'telefonoEmergencia' },
                { label: 'Seguro médico', key: 'seguroMedico' },
                { label: 'No. póliza', key: 'numeroPoliza' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type="text"
                    value={formPac[key]}
                    onChange={e => setFormPac(f => ({ ...f, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => mutEditarPac.mutate(formPac)}
                disabled={mutEditarPac.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {mutEditarPac.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alerta alergias */}
      {exp?.tieneAlergias && <AlergiasBanner alergias={exp.alergias} />}

      {/* Expediente médico */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Expediente médico</h2>
          <button
            onClick={editandoExpediente ? () => setEditandoExpediente(false) : iniciarEdicionExp}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {editandoExpediente ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {editandoExpediente ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editandoExpediente ? (
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className={labelCls}>Tipo de sangre</label>
              <select
                value={formExp.tipoSangre}
                onChange={e => setFormExp(f => ({ ...f, tipoSangre: e.target.value }))}
                className={`${inputCls} w-36`}
              >
                {[
                  ['A_POS','A+'],['A_NEG','A-'],['B_POS','B+'],['B_NEG','B-'],
                  ['AB_POS','AB+'],['AB_NEG','AB-'],['O_POS','O+'],['O_NEG','O-'],
                  ['desconocido','Desconocido'],
                ].map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select>
            </div>
            {[
              { label: 'Alergias', key: 'alergias' },
              { label: 'Enfermedades crónicas', key: 'enfermedadesCronicas' },
              { label: 'Medicamentos permanentes', key: 'medicamentosPermanentes' },
              { label: 'Antecedentes familiares', key: 'antecedentesFamiliares' },
              { label: 'Antecedentes quirúrgicos', key: 'antecedentesQuirurgicos' },
              { label: 'Antecedentes traumáticos', key: 'antecedentesTraumaticos' },
              { label: 'Observaciones generales', key: 'observacionesGenerales' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <textarea
                  value={formExp[key]}
                  onChange={e => setFormExp(f => ({ ...f, [key]: e.target.value }))}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => mutEditarExp.mutate(formExp)}
                disabled={mutEditarExp.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {mutEditarExp.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-slate-50">
            <CampoExp label="Tipo de sangre" valor={LABEL_TIPO_SANGRE[exp?.tipoSangre]} destacado={exp?.tipoSangre !== 'desconocido' && !!exp?.tipoSangre} />
            <CampoExp label="Enfermedades crónicas" valor={exp?.enfermedadesCronicas} />
            <CampoExp label="Medicamentos permanentes" valor={exp?.medicamentosPermanentes} />
            <CampoExp label="Antecedentes familiares" valor={exp?.antecedentesFamiliares} />
            <CampoExp label="Antecedentes quirúrgicos" valor={exp?.antecedentesQuirurgicos} />
            <CampoExp label="Antecedentes traumáticos" valor={exp?.antecedentesTraumaticos} />
            {exp?.observacionesGenerales && (
              <div className="col-span-2 border-t border-slate-50">
                <CampoExp label="Observaciones generales" valor={exp.observacionesGenerales} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historial de consultas */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Historial de consultas</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {historial.length}
            </span>
          </div>
          {usuario?.rol === 'medico' && exp?.activo && (
            <button
              onClick={() => setModalConsulta(true)}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva consulta
            </button>
          )}
        </div>

        {historial.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">Sin consultas registradas.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {historial.map(c => (
              <TarjetaConsulta key={c.id} consulta={c} />
            ))}
          </div>
        )}
      </div>

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

function CampoExp({ label, valor, destacado = false }) {
  return (
    <div className="px-5 py-3.5">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className={`text-sm mt-0.5 ${destacado ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
        {valor || <span className="text-slate-300 italic">—</span>}
      </p>
    </div>
  );
}

function TarjetaConsulta({ consulta }) {
  const [expandido, setExpandido] = useState(false);
  const fecha = new Date(consulta.fechaHora).toLocaleDateString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const sv = consulta.cita?.signosVitales;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">
          {/* Línea de tiempo */}
          <div className="flex flex-col items-center flex-shrink-0 pt-1">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${consulta.esEmergencia ? 'bg-red-400' : 'bg-indigo-400'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">{consulta.motivoConsulta}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {fecha} · Dr. {consulta.medico?.nombreCompleto}
              {consulta.esEmergencia && (
                <span className="ml-2 text-red-500 font-medium">Emergencia</span>
              )}
            </p>
            {consulta.diagnosticoCie10 && (
              <span className="inline-flex items-center mt-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md px-2 py-0.5 font-mono">
                {consulta.diagnosticoCie10}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpandido(e => !e)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 flex-shrink-0 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
        >
          {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expandido ? 'Ocultar' : 'Ver más'}
        </button>
      </div>

      {expandido && (
        <div className="mt-3 ml-5 pt-3 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {consulta.diagnosticoDescripcion && <CampoDetalle label="Diagnóstico" valor={consulta.diagnosticoDescripcion} />}
            {consulta.tratamiento && <CampoDetalle label="Tratamiento" valor={consulta.tratamiento} />}
            {consulta.medicamentosRecetados && <CampoDetalle label="Medicamentos" valor={consulta.medicamentosRecetados} />}
            {consulta.indicacionesGenerales && <div className="col-span-2"><CampoDetalle label="Indicaciones" valor={consulta.indicacionesGenerales} /></div>}
            {consulta.proximaCitaDias && <CampoDetalle label="Próxima cita" valor={`En ${consulta.proximaCitaDias} días`} />}
          </div>
          {sv && (
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Signos vitales</p>
              <div className="grid grid-cols-3 gap-2">
                {sv.presionArterial   && <SignoVital label="PA"    valor={sv.presionArterial} />}
                {sv.temperaturaC      && <SignoVital label="Temp"  valor={`${sv.temperaturaC}°C`} />}
                {sv.pesoKg            && <SignoVital label="Peso"  valor={`${sv.pesoKg} kg`} />}
                {sv.tallaCm           && <SignoVital label="Talla" valor={`${sv.tallaCm} cm`} />}
                {sv.frecuenciaCardiaca && <SignoVital label="FC"   valor={`${sv.frecuenciaCardiaca} lpm`} />}
                {sv.saturacionO2      && <SignoVital label="SpO2" valor={`${sv.saturacionO2}%`} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CampoDetalle({ label, valor }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-sm text-slate-700 mt-0.5">{valor}</p>
    </div>
  );
}

function SignoVital({ label, valor }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{valor}</p>
    </div>
  );
}
