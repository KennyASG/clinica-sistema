import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft, Phone, Mail, MapPin, Shield, AlertTriangle,
  Pencil, Plus, X, Check, ChevronRight, Activity,
  Stethoscope, Pill, FileText, Calendar, Paperclip, Trash2, Upload,
} from 'lucide-react';
import AlergiasBanner from '../../components/expedientes/AlergiasBanner';
import ModalConsulta from '../../components/expedientes/ModalConsulta';
import api from '../../services/api';

const LABEL_TIPO_SANGRE = {
  A_POS: 'A+', A_NEG: 'A-', B_POS: 'B+', B_NEG: 'B-',
  AB_POS: 'AB+', AB_NEG: 'AB-', O_POS: 'O+', O_NEG: 'O-',
  desconocido: '—',
};

const inputCls  = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const labelCls  = 'block text-xs font-medium text-slate-500 mb-1.5';

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
  const [consultaSeleccionadaId, setConsultaSeleccionadaId] = useState(null);

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => api.get(`/pacientes/${pacienteId}`).then(r => r.data),
  });

  const { data: historial = [] } = useQuery({
    queryKey: ['historial', paciente?.expediente?.id],
    queryFn: () => api.get(`/expedientes/${paciente.expediente.id}/historial`).then(r => r.data),
    enabled: !!paciente?.expediente?.id,
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos', paciente?.expediente?.id],
    queryFn: () => api.get(`/documentos/${paciente.expediente.id}`).then(r => r.data),
    enabled: !!paciente?.expediente?.id,
  });

  const mutSubirDoc = useMutation({
    mutationFn: (formData) => api.post('/documentos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => qc.invalidateQueries(['documentos', paciente?.expediente?.id]),
  });

  const mutEliminarDoc = useMutation({
    mutationFn: (id) => api.delete(`/documentos/${id}`),
    onSuccess: () => qc.invalidateQueries(['documentos', paciente?.expediente?.id]),
  });

  function handleSubirArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const fd = new FormData();
    fd.append('archivo', archivo);
    fd.append('expedienteId', exp.id);
    mutSubirDoc.mutate(fd);
    e.target.value = '';
  }

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
  const consultaSeleccionada = historial.find(c => c.id === consultaSeleccionadaId) ?? null;

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
    <div className="flex gap-5 max-w-6xl">

      {/* ── Columna izquierda ── */}
      <div className="flex-1 min-w-0 space-y-4">

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
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {paciente.telefono && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                      <Phone className="w-3 h-3" />{paciente.telefono}
                    </span>
                  )}
                  {paciente.correo && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                      <Mail className="w-3 h-3" />{paciente.correo}
                    </span>
                  )}
                  {paciente.direccion && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                      <MapPin className="w-3 h-3" />{paciente.direccion}
                    </span>
                  )}
                  {paciente.seguroMedico && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                      <Shield className="w-3 h-3" />{paciente.seguroMedico}
                      {paciente.numeroPoliza && ` · ${paciente.numeroPoliza}`}
                    </span>
                  )}
                </div>
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

        {/* Documentos adjuntos */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Documentos adjuntos</h2>
              {documentos.length > 0 && (
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {documentos.length}
                </span>
              )}
            </div>
            {['medico', 'enfermera', 'secretaria', 'administrador'].includes(usuario?.rol) && exp?.activo && (
              <label className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                mutSubirDoc.isPending
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}>
                <Upload className="w-3.5 h-3.5" />
                {mutSubirDoc.isPending ? 'Subiendo...' : 'Subir archivo'}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={handleSubirArchivo}
                  disabled={mutSubirDoc.isPending}
                />
              </label>
            )}
          </div>

          {mutSubirDoc.isError && (
            <p className="text-xs text-red-600 bg-red-50 px-5 py-2">
              {mutSubirDoc.error?.response?.data?.message || 'Error al subir el archivo'}
            </p>
          )}

          {documentos.length === 0 ? (
            <div className="py-10 text-center">
              <Paperclip className="w-6 h-6 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Sin documentos adjuntos</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {documentos.map(doc => (
                <FilaDocumento
                  key={doc.id}
                  doc={doc}
                  puedeEliminar={usuario?.id === doc.subidoPorId || usuario?.rol === 'administrador'}
                  onEliminar={() => mutEliminarDoc.mutate(doc.id)}
                />
              ))}
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
                <FilaConsulta
                  key={c.id}
                  consulta={c}
                  seleccionada={consultaSeleccionadaId === c.id}
                  onClick={() => setConsultaSeleccionadaId(prev => prev === c.id ? null : c.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Panel derecho ── */}
      {consultaSeleccionada && (
        <PanelConsulta
          consulta={consultaSeleccionada}
          onCerrar={() => setConsultaSeleccionadaId(null)}
        />
      )}

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

/* ─── Fila compacta de consulta ─────────────────────────────── */
function FilaConsulta({ consulta, seleccionada, onClick }) {
  const fecha = new Date(consulta.fechaHora).toLocaleDateString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const sv = consulta.cita?.signosVitales;

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
        seleccionada
          ? 'bg-indigo-50/60 border-l-2 border-indigo-500'
          : 'hover:bg-slate-50/70'
      }`}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
        consulta.esEmergencia ? 'bg-red-400' : 'bg-indigo-400'
      }`} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{consulta.motivoConsulta}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {fecha} · Dr. {consulta.medico?.nombreCompleto}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {consulta.diagnosticoCie10 && (
            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md px-1.5 py-0.5 font-mono">
              {consulta.diagnosticoCie10}
            </span>
          )}
          {consulta.cita?.tipoConsulta?.nombre && (
            <span className="text-xs text-slate-400">{consulta.cita.tipoConsulta.nombre}</span>
          )}
          {consulta.esEmergencia && (
            <span className="text-xs text-red-500 font-medium">Emergencia</span>
          )}
          {sv && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
              <Activity className="w-3 h-3" />SV
            </span>
          )}
        </div>
      </div>

      <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${
        seleccionada ? 'text-indigo-400' : 'text-slate-300'
      }`} />
    </div>
  );
}

/* ─── Panel lateral de consulta ─────────────────────────────── */
function PanelConsulta({ consulta, onCerrar }) {
  const sv = consulta.cita?.signosVitales;
  const fecha = new Date(consulta.fechaHora).toLocaleDateString('es-GT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const hora = new Date(consulta.fechaHora).toLocaleTimeString('es-GT', {
    hour: '2-digit', minute: '2-digit',
  });

  const tieneDetalle = consulta.diagnosticoCie10 || consulta.diagnosticoDescripcion ||
    consulta.tratamiento || consulta.medicamentosRecetados || consulta.indicacionesGenerales;

  return (
    <div className="w-80 shrink-0 bg-white border border-slate-100 rounded-2xl flex flex-col overflow-hidden self-start sticky top-6">

      {/* Header */}
      <div className="bg-slate-800 px-5 py-5 relative overflow-hidden">
        <button
          onClick={onCerrar}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 space-y-2">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {consulta.esEmergencia && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                Emergencia
              </span>
            )}
            {consulta.cita?.tipoConsulta?.nombre && (
              <span className="text-xs text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
                {consulta.cita.tipoConsulta.nombre}
              </span>
            )}
          </div>

          {/* Motivo */}
          <p className="text-white font-semibold text-sm leading-snug">{consulta.motivoConsulta}</p>

          {/* Doctor */}
          <p className="text-slate-400 text-xs">Dr. {consulta.medico?.nombreCompleto}</p>

          {/* Fecha + hora */}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Calendar className="w-3 h-3" />
            <span className="capitalize">{fecha}</span>
            <span>· {hora}</span>
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Diagnóstico */}
        {(consulta.diagnosticoCie10 || consulta.diagnosticoDescripcion) && (
          <div>
            <SectionLabel icono={<FileText className="w-3.5 h-3.5" />} titulo="Diagnóstico" />
            {consulta.diagnosticoCie10 && (
              <span className="inline-flex items-center font-mono text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg px-2.5 py-1 mb-2">
                {consulta.diagnosticoCie10}
              </span>
            )}
            {consulta.diagnosticoDescripcion && (
              <p className="text-sm text-slate-700 leading-relaxed">{consulta.diagnosticoDescripcion}</p>
            )}
          </div>
        )}

        {/* Tratamiento */}
        {consulta.tratamiento && (
          <div>
            <SectionLabel icono={<Stethoscope className="w-3.5 h-3.5" />} titulo="Tratamiento" />
            <p className="text-sm text-slate-700 leading-relaxed">{consulta.tratamiento}</p>
          </div>
        )}

        {/* Medicamentos */}
        {consulta.medicamentosRecetados && (
          <div>
            <SectionLabel icono={<Pill className="w-3.5 h-3.5" />} titulo="Medicamentos" />
            <p className="text-sm text-slate-700 leading-relaxed">{consulta.medicamentosRecetados}</p>
          </div>
        )}

        {/* Indicaciones */}
        {consulta.indicacionesGenerales && (
          <div>
            <SectionLabel titulo="Indicaciones" />
            <p className="text-sm text-slate-700 leading-relaxed">{consulta.indicacionesGenerales}</p>
          </div>
        )}

        {/* Próxima cita */}
        {consulta.proximaCitaDias && (
          <div>
            <SectionLabel icono={<Calendar className="w-3.5 h-3.5" />} titulo="Próxima cita" />
            <p className="text-sm text-slate-700">En {consulta.proximaCitaDias} días</p>
          </div>
        )}

        {/* Signos vitales */}
        {sv && (
          <div>
            <SectionLabel
              icono={<Activity className="w-3.5 h-3.5" />}
              titulo="Signos vitales"
              accent="emerald"
            />
            <div className="bg-slate-50 rounded-xl px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {sv.presionArterial    && <SVItem label="Presión"   valor={sv.presionArterial} />}
              {sv.frecuenciaCardiaca && <SVItem label="FC"        valor={`${sv.frecuenciaCardiaca} lpm`} />}
              {sv.saturacionO2       && <SVItem label="SpO₂"     valor={`${sv.saturacionO2}%`} />}
              {sv.temperaturaC       && <SVItem label="Temp."    valor={`${sv.temperaturaC}°C`} />}
              {sv.pesoKg             && <SVItem label="Peso"     valor={`${sv.pesoKg} kg`} />}
              {sv.tallaCm            && <SVItem label="Talla"    valor={`${sv.tallaCm} cm`} />}
              {sv.glucosaMgdl        && <SVItem label="Glucosa"  valor={`${sv.glucosaMgdl} mg/dL`} />}
              {sv.observaciones && (
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 italic">{sv.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sin detalle */}
        {!tieneDetalle && !sv && (
          <p className="text-xs text-slate-400 text-center py-6 italic">Sin detalle registrado en esta consulta</p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ titulo, icono = null, accent = null }) {
  const color = accent === 'emerald' ? 'text-emerald-500' : 'text-slate-400';
  return (
    <div className={`flex items-center gap-1.5 mb-2 ${color}`}>
      {icono}
      <p className="text-xs font-semibold uppercase tracking-wide">{titulo}</p>
    </div>
  );
}

function SVItem({ label, valor }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 leading-none">{label}</p>
      <p className="text-xs font-semibold text-slate-700 mt-0.5">{valor}</p>
    </div>
  );
}

function FilaDocumento({ doc, puedeEliminar, onEliminar }) {
  const fecha = new Date(doc.subidoEn).toLocaleDateString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const tamano = doc.tamanoBytes < 1024 * 1024
    ? `${(doc.tamanoBytes / 1024).toFixed(0)} KB`
    : `${(doc.tamanoBytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-indigo-500" />
      </div>
      <div className="min-w-0 flex-1">
        <a
          href={doc.urlStorage}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-slate-800 hover:text-indigo-600 transition-colors truncate block"
        >
          {doc.nombreArchivo}
        </a>
        <p className="text-xs text-slate-400 mt-0.5">
          {doc.descripcion ? `${doc.descripcion} · ` : ''}{tamano} · {fecha} · {doc.subidoPor?.nombreCompleto}
        </p>
      </div>
      {puedeEliminar && (
        <button
          onClick={onEliminar}
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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
