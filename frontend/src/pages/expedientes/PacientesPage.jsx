import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, UserPlus, ChevronRight, FolderOpen, Clock,
  AlertTriangle, User, Droplets, Pill, Heart, X,
} from 'lucide-react';
import PageHeader from '../../components/layouts/PageHeader';
import api from '../../services/api';

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

function calcularEdad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  ) edad--;
  return edad;
}

function tiempoRelativo(fechaStr) {
  const ahora = new Date();
  const fecha  = new Date(fechaStr);
  const diffMs = ahora - fecha;
  const mins   = Math.floor(diffMs / 60000);
  const horas  = Math.floor(mins / 60);
  const dias   = Math.floor(horas / 24);

  if (mins < 2)    return 'hace un momento';
  if (mins < 60)   return `hace ${mins} min`;
  if (horas < 24)  return `hace ${horas} h`;
  if (dias === 1)  return 'ayer';
  if (dias < 7)    return `hace ${dias} días`;
  return fecha.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });
}

const SANGRE_COLORS = {
  'A+':  'bg-red-50 text-red-600 border-red-200',
  'A-':  'bg-red-50 text-red-600 border-red-200',
  'B+':  'bg-orange-50 text-orange-600 border-orange-200',
  'B-':  'bg-orange-50 text-orange-600 border-orange-200',
  'AB+': 'bg-violet-50 text-violet-600 border-violet-200',
  'AB-': 'bg-violet-50 text-violet-600 border-violet-200',
  'O+':  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'O-':  'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function PacientesPage() {
  const navigate = useNavigate();
  const [q, setQ]               = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState(null); // { id, nombreCompleto, ... }

  const { data: resultados = [], isFetching } = useQuery({
    queryKey: ['pacientes-busqueda', busqueda],
    queryFn: () => api.get(`/pacientes?q=${encodeURIComponent(busqueda)}`).then(r => r.data),
    enabled: busqueda.length >= 2,
  });

  const { data: recientes = [] } = useQuery({
    queryKey: ['expedientes-recientes'],
    queryFn: () => api.get('/expedientes/recientes').then(r => r.data),
    enabled: busqueda.length < 2,
  });

  const { data: detalle, isLoading: cargandoDetalle } = useQuery({
    queryKey: ['paciente-detalle', seleccionado?.id],
    queryFn: () => api.get(`/pacientes/${seleccionado.id}`).then(r => r.data),
    enabled: !!seleccionado?.id,
  });

  function handleBuscar(e) {
    e.preventDefault();
    setBusqueda(q);
  }

  function seleccionar(p) {
    setSeleccionado(prev => prev?.id === p.id ? null : p);
  }

  const mostrarRecientes = busqueda.length < 2 && !isFetching;

  return (
    <div className={`flex gap-5 transition-all duration-300 ${seleccionado ? 'max-w-6xl' : 'max-w-3xl'}`}>

      {/* ── Columna izquierda ── */}
      <div className="flex-1 min-w-0 space-y-5">

        <PageHeader
          titulo="Pacientes"
          subtitulo="Busca por nombre o DPI"
          accion={
            <button
              onClick={() => navigate('/expedientes/nuevo')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo paciente
            </button>
          }
        />

        {/* Búsqueda */}
        <form onSubmit={handleBuscar} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={e => { setQ(e.target.value); if (e.target.value === '') { setBusqueda(''); setSeleccionado(null); } }}
              placeholder="Buscar por nombre o DPI..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Resultados de búsqueda */}
        {isFetching ? (
          <p className="text-sm text-slate-400">Buscando...</p>
        ) : busqueda.length >= 2 && resultados.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-xl py-14 text-center">
            <FolderOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No se encontraron pacientes para "{busqueda}"</p>
          </div>
        ) : resultados.length > 0 ? (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_160px_130px_40px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
              {['Paciente', 'DPI', 'Teléfono', ''].map(col => (
                <p key={col} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{col}</p>
              ))}
            </div>
            <div className="divide-y divide-slate-50">
              {resultados.map(p => (
                <FilaPaciente
                  key={p.id}
                  paciente={p}
                  seleccionado={seleccionado?.id === p.id}
                  onClick={() => seleccionar(p)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Actividad reciente */}
        {mostrarRecientes && recientes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Actividad reciente</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {recientes.map(exp => (
                <div
                  key={exp.id}
                  onClick={() => seleccionar({ id: exp.paciente.id, nombreCompleto: exp.paciente.nombreCompleto })}
                  className={`bg-white border rounded-xl px-4 py-3.5 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all flex items-center gap-3 ${
                    seleccionado?.id === exp.paciente.id
                      ? 'border-indigo-300 shadow-sm bg-indigo-50/30'
                      : 'border-slate-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {iniciales(exp.paciente.nombreCompleto)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{exp.paciente.nombreCompleto}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">{tiempoRelativo(exp.actualizadoEn)}</p>
                      {exp.tieneAlergias && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500">
                          <AlertTriangle className="w-3 h-3" />
                          Alergias
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado inicial vacío */}
        {mostrarRecientes && recientes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">Escribe al menos 2 caracteres para buscar</p>
          </div>
        )}
      </div>

      {/* ── Panel derecho (preview) ── */}
      {seleccionado && (
        <PanelPaciente
          detalle={detalle}
          cargando={cargandoDetalle}
          onCerrar={() => setSeleccionado(null)}
          onVerExpediente={() => navigate(`/expedientes/paciente/${seleccionado.id}`)}
        />
      )}
    </div>
  );
}

function FilaPaciente({ paciente: p, seleccionado, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[1fr_160px_130px_40px] gap-4 px-5 py-3.5 items-center cursor-pointer transition-colors ${
        seleccionado
          ? 'bg-indigo-50/60 border-l-2 border-indigo-500'
          : 'hover:bg-slate-50/70'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
          seleccionado ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-100 text-indigo-700'
        }`}>
          {iniciales(p.nombreCompleto)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{p.nombreCompleto}</p>
          <p className="text-xs text-slate-400 capitalize">{p.sexo}</p>
        </div>
      </div>
      <p className="text-xs font-mono text-slate-500">{p.dpi}</p>
      <p className="text-sm text-slate-500">{p.telefono || '—'}</p>
      <ChevronRight className={`w-4 h-4 ${seleccionado ? 'text-indigo-400' : 'text-slate-300'}`} />
    </div>
  );
}

function PanelPaciente({ detalle, cargando, onCerrar, onVerExpediente }) {
  if (cargando || !detalle) {
    return (
      <div className="w-72 shrink-0 bg-white border border-slate-100 rounded-2xl flex items-center justify-center">
        <p className="text-sm text-slate-400">{cargando ? 'Cargando...' : ''}</p>
      </div>
    );
  }

  const exp = detalle.expediente;
  const edad = calcularEdad(detalle.fechaNacimiento);
  const sangre = exp?.tipoSangre;
  const sangreCls = SANGRE_COLORS[sangre] || 'bg-slate-100 text-slate-500 border-slate-200';

  return (
    <div className="w-72 shrink-0 bg-white border border-slate-100 rounded-2xl flex flex-col overflow-hidden">

      {/* Header del panel */}
      <div className="bg-slate-800 px-5 py-5 relative overflow-hidden">
        <button
          onClick={onCerrar}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center text-center gap-2.5 relative z-10">
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center text-lg font-bold">
            {iniciales(detalle.nombreCompleto)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-snug">{detalle.nombreCompleto}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">
              {detalle.sexo}{edad !== null ? ` · ${edad} años` : ''}
            </p>
          </div>
          {sangre && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${sangreCls}`}>
              <Droplets className="w-3 h-3" />
              {sangre}
            </span>
          )}
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Datos de contacto */}
        <SeccionPanel titulo="Datos" icono={<User className="w-3.5 h-3.5" />}>
          <FilaDetalle etiqueta="DPI" valor={detalle.dpi} mono />
          <FilaDetalle etiqueta="Teléfono" valor={detalle.telefono || '—'} />
          {detalle.correo && <FilaDetalle etiqueta="Correo" valor={detalle.correo} />}
        </SeccionPanel>

        {/* Alergias */}
        {exp?.tieneAlergias && exp.alergias && (
          <SeccionPanel
            titulo="Alergias"
            icono={<AlertTriangle className="w-3.5 h-3.5" />}
            urgente
          >
            <p className="text-xs text-red-700 leading-relaxed">{exp.alergias}</p>
          </SeccionPanel>
        )}

        {/* Enfermedades crónicas */}
        {exp?.enfermedadesCronicas && (
          <SeccionPanel titulo="Enf. crónicas" icono={<Heart className="w-3.5 h-3.5" />}>
            <p className="text-xs text-slate-600 leading-relaxed">{exp.enfermedadesCronicas}</p>
          </SeccionPanel>
        )}

        {/* Medicamentos permanentes */}
        {exp?.medicamentosPermanentes && (
          <SeccionPanel titulo="Medicamentos" icono={<Pill className="w-3.5 h-3.5" />}>
            <p className="text-xs text-slate-600 leading-relaxed">{exp.medicamentosPermanentes}</p>
          </SeccionPanel>
        )}

        {/* Sin datos relevantes */}
        {!exp?.tieneAlergias && !exp?.enfermedadesCronicas && !exp?.medicamentosPermanentes && (
          <p className="text-xs text-slate-400 text-center py-2">Sin antecedentes registrados</p>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 py-4 border-t border-slate-100">
        <button
          onClick={onVerExpediente}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          Ver expediente completo
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SeccionPanel({ titulo, icono, urgente = false, children }) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 mb-2 ${urgente ? 'text-red-500' : 'text-slate-400'}`}>
        {icono}
        <p className="text-xs font-semibold uppercase tracking-wide">{titulo}</p>
      </div>
      {children}
    </div>
  );
}

function FilaDetalle({ etiqueta, valor, mono = false }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400">{etiqueta}</span>
      <span className={`text-xs text-slate-700 font-medium ${mono ? 'font-mono' : ''}`}>{valor}</span>
    </div>
  );
}
