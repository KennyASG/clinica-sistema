import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarPlus, ChevronRight, Search, Activity, X,
  Clock, User, Stethoscope, FileText, Calendar,
} from 'lucide-react';
import PageHeader from '../../components/layouts/PageHeader';
import ModalCancelarCita from '../../components/citas/ModalCancelarCita';
import ModalReagendarCita from '../../components/citas/ModalReagendarCita';
import ModalSignosVitales from '../../components/citas/ModalSignosVitales';
import api from '../../services/api';

const ESTADO_CONFIG = {
  pendiente:     { label: 'Pendiente',      cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  confirmada:    { label: 'Confirmada',     cls: 'bg-violet-50 text-violet-600 border border-violet-200' },
  en_atencion:   { label: 'En atención',    cls: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
  atendida:      { label: 'Atendida',       cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelada:     { label: 'Cancelada',      cls: 'bg-red-50 text-red-500 border border-red-200' },
  no_presentada: { label: 'No se presentó', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

const SIGUIENTE_ESTADO = {
  pendiente:  { estado: 'confirmada', label: 'Confirmar cita' },
  confirmada: { estado: 'atendida',   label: 'Marcar atendida' },
};

const ESTADOS_FILTRO = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente',     label: 'Pendiente' },
  { value: 'confirmada',    label: 'Confirmada' },
  { value: 'atendida',      label: 'Atendida' },
  { value: 'cancelada',     label: 'Cancelada' },
  { value: 'no_presentada', label: 'No se presentó' },
];

const TERMINALES = ['atendida', 'cancelada', 'no_presentada'];

function hoy() {
  return new Date().toISOString().split('T')[0];
}

function formatFechaDisplay(fechaStr) {
  const d = new Date(fechaStr + 'T00:00:00');
  return d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' });
}

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

function EstadoPill({ estado }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, cls: 'bg-slate-100 text-slate-500 border border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function CitasPage() {
  const { usuario } = useAuth();
  const [fecha, setFecha]               = useState(hoy());
  const [medicoFiltro, setMedicoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busqueda, setBusqueda]         = useState('');
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState(null);
  const [citaACancelar, setCitaACancelar]   = useState(null);
  const [citaAReagendar, setCitaAReagendar] = useState(null);
  const [citaSignosVitales, setCitaSignosVitales] = useState(null);

  const params = new URLSearchParams();
  if (fecha) params.set('fecha', fecha);
  if (medicoFiltro) params.set('medico', medicoFiltro);

  const { data: citasRaw = [], isLoading, refetch } = useQuery({
    queryKey: ['citas', fecha, medicoFiltro],
    queryFn: () => api.get(`/citas?${params.toString()}`).then(r => r.data),
  });

  const { data: medicos = [] } = useQuery({
    queryKey: ['medicos'],
    queryFn: () => api.get('/medicos').then(r => r.data),
  });

  const citas = citasRaw
    .filter(c => !estadoFiltro || c.estado === estadoFiltro)
    .filter(c => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return (
        c.paciente?.nombreCompleto?.toLowerCase().includes(q) ||
        c.medico?.nombreCompleto?.toLowerCase().includes(q)
      );
    });

  // Derive selected cita from filtered list so it auto-updates after mutations
  const citaSeleccionada = citas.find(c => c.id === citaSeleccionadaId) ?? null;

  const puedeCrear     = ['secretaria', 'administrador', 'medico'].includes(usuario?.rol);
  const puedeModificar = ['secretaria', 'administrador', 'medico'].includes(usuario?.rol);
  const puedeSignos    = ['enfermera', 'medico', 'administrador'].includes(usuario?.rol);

  function seleccionar(cita) {
    setCitaSeleccionadaId(prev => prev === cita.id ? null : cita.id);
  }

  return (
    <div className="flex gap-5 max-w-6xl">

      {/* ── Columna izquierda (tabla) ── */}
      <div className="flex-1 min-w-0 space-y-5">

        <PageHeader
          titulo="Agenda de citas"
          subtitulo={formatFechaDisplay(fecha)}
          accion={puedeCrear && (
            <Link
              to="/citas/nueva"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Nueva cita
            </Link>
          )}
        />

        {/* Tabla */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 gap-3 flex-wrap">
            <span className="text-sm text-slate-500 font-medium">
              {citas.length} {citas.length === 1 ? 'cita' : 'citas'}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar paciente o médico..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                />
              </div>
              <input
                type="date"
                value={fecha}
                onChange={e => { setFecha(e.target.value); setCitaSeleccionadaId(null); }}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={medicoFiltro}
                onChange={e => setMedicoFiltro(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos los médicos</option>
                {medicos.map(m => (
                  <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
                ))}
              </select>
              <select
                value={estadoFiltro}
                onChange={e => setEstadoFiltro(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ESTADOS_FILTRO.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cabecera columnas */}
          <div className="hidden md:grid grid-cols-[90px_1fr_160px_120px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
            {['Hora', 'Paciente', 'Médico / Tipo', 'Estado'].map(col => (
              <p key={col} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{col}</p>
            ))}
          </div>

          {isLoading ? (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-400">Cargando citas...</p>
            </div>
          ) : citas.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarPlus className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {estadoFiltro || busqueda || medicoFiltro ? 'Sin citas con ese filtro.' : 'No hay citas para este día.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {citas.map(cita => (
                <FilaCita
                  key={cita.id}
                  cita={cita}
                  seleccionada={citaSeleccionadaId === cita.id}
                  onClick={() => seleccionar(cita)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Panel derecho ── */}
      {citaSeleccionada && (
        <PanelCita
          cita={citaSeleccionada}
          puedeModificar={puedeModificar}
          puedeSignos={puedeSignos}
          rolUsuario={usuario?.rol}
          onCerrar={() => setCitaSeleccionadaId(null)}
          onCancelar={() => setCitaACancelar(citaSeleccionada)}
          onReagendar={() => setCitaAReagendar(citaSeleccionada)}
          onSignosVitales={() => setCitaSignosVitales(citaSeleccionada)}
        />
      )}

      {/* Modales */}
      {citaACancelar && (
        <ModalCancelarCita
          cita={citaACancelar}
          onCerrar={() => setCitaACancelar(null)}
          onExito={() => { setCitaACancelar(null); refetch(); }}
        />
      )}
      {citaAReagendar && (
        <ModalReagendarCita
          cita={citaAReagendar}
          onCerrar={() => setCitaAReagendar(null)}
          onExito={() => setCitaAReagendar(null)}
        />
      )}
      {citaSignosVitales && (
        <ModalSignosVitales
          cita={citaSignosVitales}
          onCerrar={() => setCitaSignosVitales(null)}
        />
      )}
    </div>
  );
}

/* ─── Fila de la tabla ─────────────────────────────────────── */
function FilaCita({ cita, seleccionada, onClick }) {
  const inicio     = new Date(cita.fechaHoraInicio);
  const fin        = new Date(cita.fechaHoraFin);
  const horaInicio = inicio.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  const horaFin    = fin.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  const esTerminal = TERMINALES.includes(cita.estado);

  const baseCls = seleccionada
    ? 'bg-indigo-50/60 border-l-2 border-indigo-500'
    : `hover:bg-slate-50/70 ${esTerminal ? 'opacity-55' : ''}`;
  const avatarCls = seleccionada ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-100 text-indigo-700';

  return (
    <div onClick={onClick} className={`cursor-pointer transition-colors ${baseCls}`}>
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-[90px_1fr_160px_120px] gap-4 px-5 py-3 items-center">
        <div>
          <p className="text-sm font-medium text-slate-700">{horaInicio}</p>
          <p className="text-xs text-slate-400">{horaFin}</p>
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarCls}`}>
            {iniciales(cita.paciente?.nombreCompleto)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{cita.paciente?.nombreCompleto}</p>
            {cita.notasSecretaria && (
              <p className="text-xs text-slate-400 truncate italic">{cita.notasSecretaria}</p>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-600 truncate">Dr. {cita.medico?.nombreCompleto}</p>
          {cita.medico?.especialidades?.[0]?.especialidad?.nombre && (
            <p className="text-xs text-indigo-400 truncate">{cita.medico.especialidades[0].especialidad.nombre}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <EstadoPill estado={cita.estado} />
          {cita.signosVitales && (
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Signos vitales registrados" />
          )}
        </div>
      </div>

      {/* Móvil */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3">
        <div className="text-center shrink-0 w-12">
          <p className="text-sm font-semibold text-slate-700">{horaInicio}</p>
          <p className="text-xs text-slate-400">{horaFin}</p>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarCls}`}>
          {iniciales(cita.paciente?.nombreCompleto)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{cita.paciente?.nombreCompleto}</p>
          <p className="text-xs text-slate-400 truncate">Dr. {cita.medico?.nombreCompleto}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <EstadoPill estado={cita.estado} />
          {cita.signosVitales && (
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Panel lateral de detalle ─────────────────────────────── */
function PanelCita({ cita, puedeModificar, puedeSignos, rolUsuario, onCerrar, onCancelar, onReagendar, onSignosVitales }) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const esTerminal = TERMINALES.includes(cita.estado);
  const siguiente  = SIGUIENTE_ESTADO[cita.estado];
  const sv         = cita.signosVitales;

  const inicio     = new Date(cita.fechaHoraInicio);
  const fin        = new Date(cita.fechaHoraFin);
  const horaInicio = inicio.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  const horaFin    = fin.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  const fechaLabel = inicio.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short' });

  const urlExpediente = rolUsuario === 'medico' && !esTerminal
    ? `/expedientes/paciente/${cita.paciente?.id}?citaId=${cita.id}`
    : `/expedientes/paciente/${cita.paciente?.id}`;

  const mutEstado = useMutation({
    mutationFn: (estado) => api.patch(`/citas/${cita.id}`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['citas'] }),
  });

  return (
    <div className="w-72 shrink-0 bg-white border border-slate-100 rounded-2xl flex flex-col overflow-hidden self-start sticky top-6">

      {/* Header */}
      <div className="bg-slate-800 px-5 py-5 relative overflow-hidden">
        <button
          onClick={onCerrar}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-2.5 relative z-10">
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center text-lg font-bold">
            {iniciales(cita.paciente?.nombreCompleto)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-snug">{cita.paciente?.nombreCompleto}</p>
          </div>
          <EstadoPill estado={cita.estado} />
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

        {/* Hora y fecha */}
        <SeccionPanel titulo="Horario" icono={<Clock className="w-3.5 h-3.5" />}>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-400">Fecha</span>
            <span className="text-xs text-slate-700 font-medium capitalize">{fechaLabel}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <span className="text-xs text-slate-400">Hora</span>
            <span className="text-xs text-slate-700 font-medium">{horaInicio} – {horaFin}</span>
          </div>
        </SeccionPanel>

        {/* Médico */}
        <SeccionPanel titulo="Médico" icono={<Stethoscope className="w-3.5 h-3.5" />}>
          <p className="text-xs font-medium text-slate-700">Dr. {cita.medico?.nombreCompleto}</p>
          {cita.medico?.especialidades?.[0]?.especialidad?.nombre && (
            <p className="text-xs text-indigo-500 mt-0.5">{cita.medico.especialidades[0].especialidad.nombre}</p>
          )}
          {cita.tipoConsulta && (
            <p className="text-xs text-slate-400 mt-0.5">{cita.tipoConsulta.nombre}</p>
          )}
        </SeccionPanel>

        {/* Notas */}
        {cita.notasSecretaria && (
          <SeccionPanel titulo="Notas" icono={<FileText className="w-3.5 h-3.5" />}>
            <p className="text-xs text-slate-600 italic leading-relaxed">{cita.notasSecretaria}</p>
          </SeccionPanel>
        )}

        {/* Signos vitales */}
        <SeccionPanel
          titulo={sv ? 'Signos vitales' : 'Signos vitales'}
          icono={<Activity className={`w-3.5 h-3.5 ${sv ? 'text-emerald-500' : ''}`} />}
          accent={sv ? 'emerald' : null}
        >
          {sv ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {sv.presionArterial   && <SVItem label="Presión"  valor={sv.presionArterial} />}
              {sv.frecuenciaCardiaca && <SVItem label="FC"      valor={`${sv.frecuenciaCardiaca} lpm`} />}
              {sv.saturacionO2      && <SVItem label="SpO₂"    valor={`${sv.saturacionO2}%`} />}
              {sv.temperaturaC      && <SVItem label="Temp."   valor={`${sv.temperaturaC}°C`} />}
              {sv.pesoKg            && <SVItem label="Peso"    valor={`${sv.pesoKg} kg`} />}
              {sv.tallaCm           && <SVItem label="Talla"   valor={`${sv.tallaCm} cm`} />}
              {sv.glucosaMgdl       && <SVItem label="Glucosa" valor={`${sv.glucosaMgdl} mg/dL`} />}
              {sv.observaciones     && (
                <div className="col-span-2 mt-1 pt-2 border-t border-slate-50">
                  <p className="text-xs text-slate-500 italic">{sv.observaciones}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Sin signos vitales registrados</p>
          )}
        </SeccionPanel>

        {/* Motivo cancelación */}
        {cita.motivoCancelacion && (
          <SeccionPanel titulo="Cancelación" icono={<X className="w-3.5 h-3.5" />} urgente>
            <p className="text-xs text-red-700 leading-relaxed">{cita.motivoCancelacion}</p>
          </SeccionPanel>
        )}
      </div>

      {/* Acciones */}
      <div className="px-4 py-4 border-t border-slate-100 space-y-2">

        {/* Ver expediente — siempre visible */}
        <button
          onClick={() => navigate(urlExpediente)}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          Ver expediente
        </button>

        {!esTerminal && (
          <>
            {/* Avanzar estado */}
            {puedeModificar && siguiente && (
              <button
                onClick={() => mutEstado.mutate(siguiente.estado)}
                disabled={mutEstado.isPending}
                className="w-full py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                {mutEstado.isPending ? 'Guardando...' : siguiente.label}
              </button>
            )}

            {/* Signos vitales */}
            {puedeSignos && (
              <button
                onClick={onSignosVitales}
                className={`w-full py-2 text-sm font-medium rounded-xl border transition-colors ${
                  sv
                    ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {sv ? 'Ver signos vitales' : 'Registrar signos vitales'}
              </button>
            )}

            {/* Reagendar + No se presentó */}
            {puedeModificar && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onReagendar}
                  className="py-2 text-xs font-medium border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Reagendar
                </button>
                <button
                  onClick={() => mutEstado.mutate('no_presentada')}
                  disabled={mutEstado.isPending}
                  className="py-2 text-xs font-medium border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  No llegó
                </button>
              </div>
            )}

            {/* Cancelar */}
            {puedeModificar && (
              <button
                onClick={onCancelar}
                className="w-full py-2 text-sm font-medium border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
              >
                Cancelar cita
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SeccionPanel({ titulo, icono, urgente = false, accent = null, children }) {
  const colorCls = urgente ? 'text-red-500' : accent === 'emerald' ? 'text-emerald-500' : 'text-slate-400';
  return (
    <div>
      <div className={`flex items-center gap-1.5 mb-2 ${colorCls}`}>
        {icono}
        <p className="text-xs font-semibold uppercase tracking-wide">{titulo}</p>
      </div>
      {children}
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
