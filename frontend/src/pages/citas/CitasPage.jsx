import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, MoreHorizontal, ChevronRight, Search } from 'lucide-react';
import ModalCancelarCita from '../../components/citas/ModalCancelarCita';
import ModalReagendarCita from '../../components/citas/ModalReagendarCita';
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
  pendiente:  { estado: 'confirmada', label: 'Confirmar' },
  confirmada: { estado: 'atendida',   label: 'Atendida' },
};

const ESTADOS_FILTRO = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente',     label: 'Pendiente' },
  { value: 'confirmada',    label: 'Confirmada' },
  { value: 'atendida',      label: 'Atendida' },
  { value: 'cancelada',     label: 'Cancelada' },
  { value: 'no_presentada', label: 'No se presentó' },
];

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
  const [citaACancelar, setCitaACancelar]   = useState(null);
  const [citaAReagendar, setCitaAReagendar] = useState(null);

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

  const puedeCrear     = ['secretaria', 'administrador', 'medico'].includes(usuario?.rol);
  const puedeModificar = ['secretaria', 'administrador', 'medico'].includes(usuario?.rol);

  return (
    <div className="max-w-5xl space-y-5">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Agenda de citas</h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">{formatFechaDisplay(fecha)}</p>
        </div>
        {puedeCrear && (
          <Link
            to="/citas/nueva"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            Nueva cita
          </Link>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">

        {/* Toolbar de la tabla */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 gap-3 flex-wrap">
          <span className="text-sm text-slate-500 font-medium">
            {citas.length} {citas.length === 1 ? 'cita' : 'citas'}
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar paciente o médico..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
              />
            </div>

            {/* Fecha */}
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Médico */}
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

            {/* Estado */}
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

        {/* Cabecera de columnas */}
        <div className="grid grid-cols-[100px_1fr_180px_130px_190px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
          {['Hora', 'Paciente', 'Médico / Tipo', 'Estado', 'Acciones'].map(col => (
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
                puedeModificar={puedeModificar}
                rolUsuario={usuario?.rol}
                onCancelar={() => setCitaACancelar(cita)}
                onReagendar={() => setCitaAReagendar(cita)}
              />
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}

function FilaCita({ cita, puedeModificar, onCancelar, onReagendar, rolUsuario }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const siguiente  = SIGUIENTE_ESTADO[cita.estado];
  const inicio     = new Date(cita.fechaHoraInicio);
  const fin        = new Date(cita.fechaHoraFin);
  const horaInicio = inicio.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  const horaFin    = fin.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

  const TERMINALES = ['atendida', 'cancelada', 'no_presentada'];
  const esTerminal = TERMINALES.includes(cita.estado);

  const urlExpediente = rolUsuario === 'medico' && !esTerminal
    ? `/expedientes/paciente/${cita.paciente?.id}?citaId=${cita.id}`
    : `/expedientes/paciente/${cita.paciente?.id}`;

  const mutEstado = useMutation({
    mutationFn: (estado) => api.patch(`/citas/${cita.id}`, { estado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citas'] });
      setMenuAbierto(false);
    },
  });

  return (
    <div className={`grid grid-cols-[100px_1fr_180px_130px_190px] gap-4 px-5 py-3 items-center hover:bg-slate-50/70 transition-colors ${esTerminal ? 'opacity-55' : ''}`}>

      {/* Hora */}
      <div>
        <p className="text-sm font-medium text-slate-700">{horaInicio}</p>
        <p className="text-xs text-slate-400">{horaFin}</p>
      </div>

      {/* Paciente */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {iniciales(cita.paciente?.nombreCompleto)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{cita.paciente?.nombreCompleto}</p>
          {cita.notasSecretaria && (
            <p className="text-xs text-slate-400 truncate italic">{cita.notasSecretaria}</p>
          )}
        </div>
      </div>

      {/* Médico / Tipo */}
      <div className="min-w-0">
        <p className="text-sm text-slate-600 truncate">Dr. {cita.medico?.nombreCompleto}</p>
        {cita.medico?.especialidades?.[0]?.especialidad?.nombre && (
          <p className="text-xs text-indigo-400 truncate">{cita.medico.especialidades[0].especialidad.nombre}</p>
        )}
        {cita.tipoConsulta && (
          <p className="text-xs text-slate-400 truncate">{cita.tipoConsulta.nombre}</p>
        )}
      </div>

      {/* Estado */}
      <EstadoPill estado={cita.estado} />

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(urlExpediente)}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
        >
          Expediente
          <ChevronRight className="w-3 h-3" />
        </button>

        {puedeModificar && !esTerminal && siguiente && (
          <button
            onClick={() => mutEstado.mutate(siguiente.estado)}
            disabled={mutEstado.isPending}
            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {mutEstado.isPending ? '...' : siguiente.label}
          </button>
        )}

        {puedeModificar && !esTerminal && (
          <div className="relative">
            <button
              onClick={() => setMenuAbierto(m => !m)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                  <button
                    onClick={() => { setMenuAbierto(false); onReagendar(); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Reagendar
                  </button>
                  <button
                    onClick={() => mutEstado.mutate('no_presentada')}
                    disabled={mutEstado.isPending}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    No se presentó
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => { setMenuAbierto(false); onCancelar(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    Cancelar cita
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
