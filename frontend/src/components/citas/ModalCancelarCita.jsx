import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../../services/api';

export default function ModalCancelarCita({ cita, onCerrar, onExito }) {
  const [motivo, setMotivo] = useState('');
  const [apiError, setApiError] = useState('');

  const mutCancelar = useMutation({
    mutationFn: () => api.patch(`/citas/${cita.id}`, {
      estado: 'cancelada',
      motivoCancelacion: motivo,
    }),
    onSuccess: onExito,
    onError: (err) => setApiError(err.response?.data?.message || 'Error al cancelar la cita'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    if (motivo.trim().length < 5) {
      setApiError('El motivo debe tener al menos 5 caracteres');
      return;
    }
    mutCancelar.mutate();
  }

  const inicio = new Date(cita.fechaHoraInicio).toLocaleString('es-GT', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Cancelar cita</h2>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Info de la cita */}
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-slate-800">{cita.paciente?.nombreCompleto}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {inicio} · Dr. {cita.medico?.nombreCompleto}
            </p>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Motivo de cancelación *
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              rows={3}
              placeholder="Describa el motivo de la cancelación..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1">{motivo.length} caracteres (mínimo 5)</p>
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
              Volver
            </button>
            <button
              type="submit"
              disabled={mutCancelar.isPending}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {mutCancelar.isPending ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
