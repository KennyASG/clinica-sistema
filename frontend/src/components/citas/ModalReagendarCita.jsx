import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const SLOTS_HORA = (() => {
  const slots = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 21 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
})();

function buildISO(fecha, horaHHMM) {
  const [hh, mm] = horaHHMM.split(':').map(Number);
  const [yy, mo, dd] = fecha.split('-').map(Number);
  return new Date(yy, mo - 1, dd, hh, mm, 0).toISOString();
}

export default function ModalReagendarCita({ cita, onCerrar, onExito }) {
  const qc = useQueryClient();
  const fechaActual = new Date(cita.fechaHoraInicio).toISOString().split('T')[0];
  const horaInicioActual = new Date(cita.fechaHoraInicio)
    .toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });
  const horaFinActual = new Date(cita.fechaHoraFin)
    .toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });

  const [fecha, setFecha] = useState(fechaActual);
  const [horaInicio, setHoraInicio] = useState(horaInicioActual);
  const [horaFin, setHoraFin] = useState(horaFinActual);
  const [notas, setNotas] = useState(cita.notasSecretaria || '');
  const [apiError, setApiError] = useState('');

  const slotsFin = horaInicio ? SLOTS_HORA.filter(s => s > horaInicio) : SLOTS_HORA;

  const mutReagendar = useMutation({
    mutationFn: (data) => api.patch(`/citas/${cita.id}/reagendar`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citas'] });
      onExito();
    },
    onError: (err) => setApiError(err.response?.data?.message || 'Error al reagendar'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    if (!fecha || !horaInicio || !horaFin) {
      setApiError('Complete la fecha y horario');
      return;
    }
    mutReagendar.mutate({
      fechaHoraInicio: buildISO(fecha, horaInicio),
      fechaHoraFin:    buildISO(fecha, horaFin),
      ...(notas && { notasSecretaria: notas }),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Reagendar cita</h2>
            <p className="text-xs text-gray-400 mt-0.5">{cita.paciente?.nombreCompleto} · Dr. {cita.medico?.nombreCompleto}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio *</label>
              <select
                value={horaInicio}
                onChange={e => {
                  const v = e.target.value;
                  setHoraInicio(v);
                  if (horaFin && horaFin <= v) setHoraFin('');
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- hora --</option>
                {SLOTS_HORA.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin *</label>
              <select
                value={horaFin}
                onChange={e => setHoraFin(e.target.value)}
                disabled={!horaInicio}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">-- hora --</option>
                {slotsFin.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Al reagendar, la cita vuelve a estado <strong>Pendiente</strong> para que sea confirmada nuevamente.
          </p>

          {apiError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{apiError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
              Cancelar
            </button>
            <button type="submit" disabled={mutReagendar.isPending}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium">
              {mutReagendar.isPending ? 'Guardando...' : 'Reagendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
