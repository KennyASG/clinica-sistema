import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import ModalCancelarCita from '../../components/citas/ModalCancelarCita';
import ModalReagendarCita from '../../components/citas/ModalReagendarCita';
import api from '../../services/api';

const ESTADO_BADGE = {
  pendiente:     { cls: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
  confirmada:    { cls: 'bg-blue-100 text-blue-700',     label: 'Confirmada' },
  en_atencion:   { cls: 'bg-purple-100 text-purple-700', label: 'En atención' },
  atendida:      { cls: 'bg-green-100 text-green-700',   label: 'Atendida' },
  cancelada:     { cls: 'bg-red-100 text-red-600',       label: 'Cancelada' },
  no_presentada: { cls: 'bg-gray-100 text-gray-500',     label: 'No se presentó' },
};

// pendiente → confirmada → atendida (en_atencion se omite del flujo de secretaria)
const SIGUIENTE_ESTADO = {
  pendiente:  { estado: 'confirmada', label: 'Confirmar',       cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' },
  confirmada: { estado: 'atendida',   label: 'Marcar atendida', cls: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' },
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

export default function CitasPage() {
  const { usuario } = useAuth();
  const [fecha, setFecha]           = useState(hoy());
  const [medicoFiltro, setMedicoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [citaACancelar, setCitaACancelar]   = useState(null);
  const [citaAReagendar, setCitaAReagendar] = useState(null);

  const params = new URLSearchParams();
  if (fecha) params.set('fecha', fecha);
  if (medicoFiltro) params.set('medico', medicoFiltro);

  const { data: citasRaw = [], isLoading, refetch } = useQuery({
    queryKey: ['citas', fecha, medicoFiltro],
    queryFn: () => api.get(`/citas?${params.toString()}`).then(r => r.data),
  });

  // Filtro de estado se aplica en cliente (evita un endpoint extra)
  const citas = estadoFiltro
    ? citasRaw.filter(c => c.estado === estadoFiltro)
    : citasRaw;

  const { data: medicos = [] } = useQuery({
    queryKey: ['medicos'],
    queryFn: () => api.get('/medicos').then(r => r.data),
  });

  const total      = citasRaw.length;
  const pendientes = citasRaw.filter(c => c.estado === 'pendiente').length;
  const confirmadas = citasRaw.filter(c => c.estado === 'confirmada').length;
  const atendidas  = citasRaw.filter(c => c.estado === 'atendida').length;
  const canceladas = citasRaw.filter(c => c.estado === 'cancelada').length;

  const puedeCrear     = ['secretaria', 'administrador', 'medico'].includes(usuario?.rol);
  const puedeModificar = ['secretaria', 'administrador', 'medico'].includes(usuario?.rol);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Agenda de citas</h1>
        {puedeCrear && (
          <Link
            to="/citas/nueva"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            + Nueva cita
          </Link>
        )}
      </div>

      {/* Métricas del día — clicables para filtrar por estado */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total',      value: total,      est: '',            cls: 'text-gray-700' },
          { label: 'Pendientes', value: pendientes, est: 'pendiente',   cls: 'text-yellow-600' },
          { label: 'Confirmadas',value: confirmadas,est: 'confirmada',  cls: 'text-blue-600' },
          { label: 'Atendidas',  value: atendidas,  est: 'atendida',    cls: 'text-green-600' },
          { label: 'Canceladas', value: canceladas, est: 'cancelada',   cls: 'text-red-500' },
        ].map(({ label, value, est, cls }) => (
          <button
            key={label}
            onClick={() => setEstadoFiltro(estadoFiltro === est ? '' : est)}
            className={`bg-white rounded-lg shadow p-4 text-center transition-all ${
              estadoFiltro === est && est !== '' ? 'ring-2 ring-blue-400' : 'hover:shadow-md'
            }`}
          >
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Médico</label>
          <select
            value={medicoFiltro}
            onChange={e => setMedicoFiltro(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los médicos</option>
            {medicos.map(m => (
              <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select
            value={estadoFiltro}
            onChange={e => setEstadoFiltro(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ESTADOS_FILTRO.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
        {(medicoFiltro || estadoFiltro) && (
          <button
            onClick={() => { setMedicoFiltro(''); setEstadoFiltro(''); }}
            className="text-xs text-gray-400 hover:text-gray-600 pb-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista de citas */}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {isLoading ? (
          <p className="text-gray-400 text-sm text-center py-10">Cargando citas...</p>
        ) : citas.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            {estadoFiltro || medicoFiltro ? 'Sin citas con ese filtro.' : 'No hay citas para este día.'}
          </p>
        ) : (
          citas.map(cita => (
            <FilaCita
              key={cita.id}
              cita={cita}
              puedeModificar={puedeModificar}
              rolUsuario={usuario?.rol}
              onCancelar={() => setCitaACancelar(cita)}
              onReagendar={() => setCitaAReagendar(cita)}
            />
          ))
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

  const badge     = ESTADO_BADGE[cita.estado] ?? { cls: 'bg-gray-100 text-gray-500', label: cita.estado };
  const siguiente = SIGUIENTE_ESTADO[cita.estado];
  const inicio    = new Date(cita.fechaHoraInicio);
  const fin       = new Date(cita.fechaHoraFin);
  const hora      = `${inicio.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })} – ${fin.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`;

  const TERMINALES = ['atendida', 'cancelada', 'no_presentada'];
  const esTerminal = TERMINALES.includes(cita.estado);

  // URL al expediente — si es médico y la cita no está terminal, incluye citaId
  // para abrir el modal de consulta automáticamente
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
    <div className="px-5 py-4 flex items-center gap-4">
      {/* Hora */}
      <div className="w-28 text-sm font-mono text-gray-500 flex-shrink-0">{hora}</div>

      {/* Paciente + médico */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{cita.paciente?.nombreCompleto}</p>
        <p className="text-xs text-gray-400">
          Dr. {cita.medico?.nombreCompleto}
          {cita.tipoConsulta && <span> · {cita.tipoConsulta.nombre}</span>}
        </p>
        {cita.notasSecretaria && (
          <p className="text-xs text-gray-400 italic truncate mt-0.5">{cita.notasSecretaria}</p>
        )}
      </div>

      {/* Badge de estado */}
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.cls}`}>
        {badge.label}
      </span>

      {/* Ver expediente — siempre visible */}
      <button
        onClick={() => navigate(urlExpediente)}
        className="text-xs text-blue-500 hover:underline flex-shrink-0"
      >
        Ver expediente
      </button>

      {/* Acciones de estado */}
      {puedeModificar && !esTerminal && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {siguiente && (
            <button
              onClick={() => mutEstado.mutate(siguiente.estado)}
              disabled={mutEstado.isPending}
              className={`text-xs font-medium px-3 py-1.5 rounded ${siguiente.cls} disabled:opacity-50`}
            >
              {mutEstado.isPending ? '...' : siguiente.label}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuAbierto(m => !m)}
              className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 text-base leading-none"
              title="Más opciones"
            >
              ···
            </button>
            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg z-20 py-1">
                  <button
                    onClick={() => { setMenuAbierto(false); onReagendar(); }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                  >
                    Reagendar
                  </button>
                  <button
                    onClick={() => mutEstado.mutate('no_presentada')}
                    disabled={mutEstado.isPending}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    No se presentó
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => { setMenuAbierto(false); onCancelar(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Cancelar cita
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
