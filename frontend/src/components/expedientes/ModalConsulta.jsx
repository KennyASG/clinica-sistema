import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const FORM_INICIAL = {
  motivoConsulta: '', diagnosticoCie10: '', diagnosticoDescripcion: '',
  tratamiento: '', medicamentosRecetados: '', indicacionesGenerales: '',
  proximaCitaDias: '', esEmergencia: false,
};

export default function ModalConsulta({ expedienteId, onCerrar }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(FORM_INICIAL);
  const [apiError, setApiError] = useState('');

  const mutCrear = useMutation({
    mutationFn: (data) => api.post('/consultas', data),
    onSuccess: () => {
      qc.invalidateQueries(['historial', expedienteId]);
      onCerrar();
    },
    onError: (err) => setApiError(err.response?.data?.message || 'Error al guardar la consulta'),
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const payload = {
      expedienteId,
      motivoConsulta: form.motivoConsulta,
      esEmergencia: form.esEmergencia,
      ...(form.diagnosticoCie10 && { diagnosticoCie10: form.diagnosticoCie10 }),
      ...(form.diagnosticoDescripcion && { diagnosticoDescripcion: form.diagnosticoDescripcion }),
      ...(form.tratamiento && { tratamiento: form.tratamiento }),
      ...(form.medicamentosRecetados && { medicamentosRecetados: form.medicamentosRecetados }),
      ...(form.indicacionesGenerales && { indicacionesGenerales: form.indicacionesGenerales }),
      ...(form.proximaCitaDias && { proximaCitaDias: parseInt(form.proximaCitaDias) }),
    };
    mutCrear.mutate(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Nueva nota de consulta</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de consulta *</label>
            <textarea name="motivoConsulta" value={form.motivoConsulta} onChange={handleChange} required rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código CIE-10</label>
              <input type="text" name="diagnosticoCie10" value={form.diagnosticoCie10} onChange={handleChange}
                placeholder="Ej: J06.9" maxLength={10}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Días para próxima cita</label>
              <input type="number" name="proximaCitaDias" value={form.proximaCitaDias} onChange={handleChange}
                min={1} placeholder="Ej: 30"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <Textarea label="Diagnóstico" name="diagnosticoDescripcion" value={form.diagnosticoDescripcion} onChange={handleChange} />
          <Textarea label="Tratamiento" name="tratamiento" value={form.tratamiento} onChange={handleChange} />
          <Textarea label="Medicamentos recetados" name="medicamentosRecetados" value={form.medicamentosRecetados} onChange={handleChange} />
          <Textarea label="Indicaciones generales" name="indicacionesGenerales" value={form.indicacionesGenerales} onChange={handleChange} />

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="esEmergencia" checked={form.esEmergencia} onChange={handleChange}
              className="rounded border-gray-300" />
            Consulta de emergencia (fuera de cita programada)
          </label>

          {apiError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{apiError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
              Cancelar
            </button>
            <button type="submit" disabled={mutCrear.isPending}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium">
              {mutCrear.isPending ? 'Guardando...' : 'Guardar consulta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Textarea({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea name={name} value={value} onChange={onChange} rows={2}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
