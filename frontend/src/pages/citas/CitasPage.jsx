import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import ModalCancelarCita from '../../components/citas/ModalCancelarCita';
import api from '../../services/api';

const ESTADO_BADGE = {
  pendiente:    { cls: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
  confirmada:   { cls: 'bg-blue-100 text-blue-700',    label: 'Confirmada' },
  en_atencion:  { cls: 'bg-purple-100 text-purple-700',label: 'En atención' },
  atendida:     { cls: 'bg-green-100 text-green-700',  label: 'Atendida' },
  cancelada:    { cls: 'bg-red-100 text-red-600',      label: 'Cancelada' },
  no_presentada:{ cls: 'bg-gray-100 text-gray-500',   label: 'No se presentó' },
};

function hoy() {
  return new Date().toISOString().split('T')[0];
}

export default function CitasPage() {
  const { usuario } = useAuth();
  const [fecha, setFecha] = useState(hoy());
  const [medicoFiltro, setMedicoFiltro] = useState(
    usuario?.rol === 'medico' ? usuario.id : ''
  );
  const [citaACancelar, setCitaACancelar] = useState(null);

  const params = new URLSearchParams();
  if (fecha) params.set('fecha', fecha);
  if (medicoFiltro) params.set('medico', medicoFiltro);

  const { data: citas = [], isLoading, refetch } = useQuery({
    queryKey: ['citas', fecha, medicoFiltro],
    queryFn: () => api.get(`/citas?${params.toString()}`).then(r => r.data),
  });

  const { data: medicos = [] } = useQuery({
    queryKey: ['usuarios-medicos'],
    queryFn: () => api.get('/medicos').then(r => r.data),
    enabled: usuario?.rol !== 'medico',
  });

  // Métricas del día
  const total      = citas.length;
  const pendientes = citas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length;
  const atendidas  = citas.filter(c => c.estado === 'atendida').length;
  const canceladas = citas.filter(c => c.estado === 'cancelada').length;

  const puedeCrear = ['secretaria', 'administrador', 'medico'].includes(usuario?.rol);
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

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: total, cls: 'text-gray-700' },
          { label: 'Pendientes', value: pendientes, cls: 'text-yellow-600' },
          { label: 'Atendidas', value: atendidas, cls: 'text-green-600' },
          { label: 'Canceladas', value: canceladas, cls: 'text-red-500' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-lg shadow p-4 text-center">
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {usuario?.rol !== 'medico' && (
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
        )}
      </div>

      {/* Lista de citas */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <p className="text-gray-400 text-sm text-center py-10">Cargando citas...</p>
        ) : citas.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No hay citas para este día.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {citas.map(cita => (
              <FilaCita
                key={cita.id}
                cita={cita}
                puedeModificar={puedeModificar}
                onCancelar={() => setCitaACancelar(cita)}
                onRefresh={refetch}
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
    </div>
  );
}

function FilaCita({ cita, puedeModificar, onCancelar, onRefresh }) {
  const badge = ESTADO_BADGE[cita.estado] ?? { cls: 'bg-gray-100 text-gray-500', label: cita.estado };
  const inicio = new Date(cita.fechaHoraInicio);
  const fin    = new Date(cita.fechaHoraFin);
  const hora   = `${inicio.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })} – ${fin.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`;

  const TERMINALES = ['atendida', 'cancelada', 'no_presentada'];
  const puedeCancel = puedeModificar && !TERMINALES.includes(cita.estado);

  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4">
      <div className="w-28 text-sm font-mono text-gray-600 flex-shrink-0">{hora}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{cita.paciente?.nombreCompleto}</p>
        <p className="text-xs text-gray-400">Dr. {cita.medico?.nombreCompleto}
          {cita.tipoConsulta && <span> · {cita.tipoConsulta.nombre}</span>}
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
        {badge.label}
      </span>
      {puedeCancel && (
        <button
          onClick={onCancelar}
          className="text-xs text-red-500 hover:underline flex-shrink-0"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
