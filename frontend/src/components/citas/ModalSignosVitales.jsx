import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Activity } from 'lucide-react';
import api from '../../services/api';

const CAMPOS = [
  { key: 'presionArterial',    label: 'Presión arterial',    placeholder: '120/80',  tipo: 'text',   unidad: 'mmHg' },
  { key: 'frecuenciaCardiaca', label: 'Frec. cardíaca',      placeholder: '72',      tipo: 'number', unidad: 'lpm'  },
  { key: 'saturacionO2',       label: 'Saturación O₂',       placeholder: '98',      tipo: 'number', unidad: '%'    },
  { key: 'temperaturaC',       label: 'Temperatura',         placeholder: '36.5',    tipo: 'number', unidad: '°C'   },
  { key: 'pesoKg',             label: 'Peso',                placeholder: '70.0',    tipo: 'number', unidad: 'kg'   },
  { key: 'tallaCm',            label: 'Talla',               placeholder: '170',     tipo: 'number', unidad: 'cm'   },
  { key: 'glucosaMgdl',        label: 'Glucosa',             placeholder: '90',      tipo: 'number', unidad: 'mg/dL'},
];

const VACIO = Object.fromEntries(CAMPOS.map(c => [c.key, '']));

export default function ModalSignosVitales({ cita, onCerrar, onExito }) {
  const qc = useQueryClient();
  const sv = cita.signosVitales;
  const [form, setForm]       = useState(VACIO);
  const [observaciones, setObservaciones] = useState('');
  const [apiError, setApiError] = useState('');

  const mutGuardar = useMutation({
    mutationFn: () => {
      const payload = { citaId: cita.id };
      CAMPOS.forEach(({ key, tipo }) => {
        if (form[key] !== '') {
          payload[key] = tipo === 'number' ? Number(form[key]) : form[key];
        }
      });
      if (observaciones.trim()) payload.observaciones = observaciones.trim();
      return api.post('/signos-vitales', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citas'] });
      onExito?.();
      onCerrar();
    },
    onError: (err) => setApiError(err.response?.data?.message || 'Error al guardar'),
  });

  const inicio = new Date(cita.fechaHoraInicio).toLocaleString('es-GT', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

  // Si ya existen signos vitales, mostrar en modo lectura
  if (sv) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <h2 className="text-base font-semibold text-slate-900">Signos vitales</h2>
            </div>
            <button onClick={onCerrar} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-slate-800">{cita.paciente?.nombreCompleto}</p>
              <p className="text-xs text-slate-400 mt-0.5">{inicio}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CAMPOS.map(({ key, label, unidad }) => {
                const val = sv[key];
                if (val == null) return null;
                return (
                  <div key={key} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {val} <span className="text-xs font-normal text-slate-400">{unidad}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            {sv.observaciones && (
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-400 font-medium mb-1">Observaciones</p>
                <p className="text-sm text-slate-700">{sv.observaciones}</p>
              </div>
            )}
            <div className="flex justify-end pt-1">
              <button onClick={onCerrar} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario para registrar
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-900">Registrar signos vitales</h2>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setApiError(''); mutGuardar.mutate(); }}
          className="overflow-y-auto px-6 py-5 space-y-4"
        >
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-slate-800">{cita.paciente?.nombreCompleto}</p>
            <p className="text-xs text-slate-400 mt-0.5">{inicio} · Dr. {cita.medico?.nombreCompleto}</p>
          </div>

          <p className="text-xs text-slate-400">Todos los campos son opcionales. Llena solo los disponibles.</p>

          <div className="grid grid-cols-2 gap-3">
            {CAMPOS.map(({ key, label, placeholder, tipo, unidad }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={tipo}
                    step={tipo === 'number' ? 'any' : undefined}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    {unidad}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Observaciones adicionales..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {apiError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1 flex-shrink-0">
            <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutGuardar.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {mutGuardar.isPending ? 'Guardando...' : 'Guardar signos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
