import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Cancelar cita</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded p-3 text-sm">
            <p className="font-medium text-gray-800">{cita.paciente?.nombreCompleto}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {inicio} · Dr. {cita.medico?.nombreCompleto}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de cancelación *
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              rows={3}
              required
              placeholder="Describa el motivo de la cancelación..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <p className="text-xs text-gray-400 mt-1">{motivo.length} caracteres (mínimo 5)</p>
          </div>

          {apiError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{apiError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={mutCancelar.isPending}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded font-medium"
            >
              {mutCancelar.isPending ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
