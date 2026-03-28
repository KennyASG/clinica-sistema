import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Link2 } from 'lucide-react';
import api from '../../services/api';
import CIE10Input from './CIE10Input';

const FORM_INICIAL = {
  motivoConsulta: '', diagnosticoCie10: '', diagnosticoDescripcion: '',
  tratamiento: '', medicamentosRecetados: '', indicacionesGenerales: '',
  proximaCitaDias: '', esEmergencia: false,
};

const labelCls = 'block text-xs font-medium text-slate-500 mb-1.5';
const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

export default function ModalConsulta({ expedienteId, citaId, onCerrar }) {
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
      ...(citaId && { citaId }),
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header fijo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Nueva nota de consulta</h2>
            {citaId && (
              <p className="flex items-center gap-1 text-xs text-indigo-600 mt-0.5">
                <Link2 className="w-3 h-3" />
                Vinculada a cita programada
              </p>
            )}
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4 flex-1">

          <div>
            <label className={labelCls}>Motivo de consulta *</label>
            <textarea
              name="motivoConsulta"
              value={form.motivoConsulta}
              onChange={handleChange}
              required
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Código CIE-10</label>
              <CIE10Input
                value={form.diagnosticoCie10}
                onChange={(v) => setForm(f => ({ ...f, diagnosticoCie10: v }))}
              />
            </div>
            <div>
              <label className={labelCls}>Días para próxima cita</label>
              <input
                type="number"
                name="proximaCitaDias"
                value={form.proximaCitaDias}
                onChange={handleChange}
                min={1}
                placeholder="Ej: 30"
                className={inputCls}
              />
            </div>
          </div>

          <FieldTextarea label="Diagnóstico" name="diagnosticoDescripcion" value={form.diagnosticoDescripcion} onChange={handleChange} />
          <FieldTextarea label="Tratamiento" name="tratamiento" value={form.tratamiento} onChange={handleChange} />
          <FieldTextarea label="Medicamentos recetados" name="medicamentosRecetados" value={form.medicamentosRecetados} onChange={handleChange} />
          <FieldTextarea label="Indicaciones generales" name="indicacionesGenerales" value={form.indicacionesGenerales} onChange={handleChange} />

          <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              name="esEmergencia"
              checked={form.esEmergencia}
              onChange={handleChange}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Consulta de emergencia (fuera de cita programada)
          </label>

          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {apiError}
            </p>
          )}
        </form>

        {/* Footer fijo */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="consulta-form"
            onClick={handleSubmit}
            disabled={mutCrear.isPending}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {mutCrear.isPending ? 'Guardando...' : 'Guardar consulta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldTextarea({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={2}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}
