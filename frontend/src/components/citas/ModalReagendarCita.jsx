import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
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

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const labelCls = 'block text-xs font-medium text-slate-500 mb-1.5';

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Reagendar cita</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {cita.paciente?.nombreCompleto} · Dr. {cita.medico?.nombreCompleto}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">

          {/* Fecha */}
          <div>
            <label className={labelCls}>Nueva fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={inputCls}
            />
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Hora inicio *</label>
              <select
                value={horaInicio}
                onChange={e => {
                  const v = e.target.value;
                  setHoraInicio(v);
                  if (horaFin && horaFin <= v) setHoraFin('');
                }}
                className={inputCls}
              >
                <option value="">-- hora --</option>
                {SLOTS_HORA.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Hora fin *</label>
              <select
                value={horaFin}
                onChange={e => setHoraFin(e.target.value)}
                disabled={!horaInicio}
                className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed`}
              >
                <option value="">-- hora --</option>
                {slotsFin.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className={labelCls}>Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Advertencia */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Al reagendar, la cita vuelve a estado <strong>Pendiente</strong> para que sea confirmada nuevamente.
            </p>
          </div>

          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {apiError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutReagendar.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {mutReagendar.isPending ? 'Guardando...' : 'Reagendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
