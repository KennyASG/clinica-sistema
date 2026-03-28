import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';

function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useState(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  });
  return debouncedValue;
}

const FORM_INICIAL = {
  pacienteId: '',
  medicoId: '',
  tipoConsultaId: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  notasSecretaria: '',
};

export default function NuevaCitaPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(FORM_INICIAL);
  const [busqueda, setBusqueda] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [apiError, setApiError] = useState('');

  const { data: pacientesResultados = [] } = useQuery({
    queryKey: ['buscar-pacientes', busqueda],
    queryFn: () => api.get(`/pacientes?q=${encodeURIComponent(busqueda)}`).then(r => r.data),
    enabled: busqueda.length >= 2,
  });

  const { data: medicos = [] } = useQuery({
    queryKey: ['usuarios-medicos'],
    queryFn: () => api.get('/medicos').then(r => r.data),
  });

  const { data: tiposConsulta = [] } = useQuery({
    queryKey: ['tipo-consultas'],
    queryFn: () => api.get('/tipo-consultas').then(r => r.data),
  });

  const mutCrear = useMutation({
    mutationFn: (data) => api.post('/citas', data),
    onSuccess: () => navigate('/citas'),
    onError: (err) => setApiError(err.response?.data?.message || 'Error al crear la cita'),
  });

  function seleccionarPaciente(p) {
    setPacienteSeleccionado(p);
    setForm(f => ({ ...f, pacienteId: p.id }));
    setBusqueda('');
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function parseFechaHora(fecha, hora) {
    // hora viene como "HH:MM" o "HH:MM:SS" desde type="time"
    const [hh, mm] = hora.split(':').map(Number);
    const [yy, mo, dd] = fecha.split('-').map(Number);
    return new Date(yy, mo - 1, dd, hh, mm, 0);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    if (!form.pacienteId) { setApiError('Seleccione un paciente'); return; }
    if (!form.medicoId) { setApiError('Seleccione un médico'); return; }
    if (!form.tipoConsultaId) { setApiError('Seleccione el tipo de consulta'); return; }
    if (!form.fecha || !form.horaInicio || !form.horaFin) {
      setApiError('Complete la fecha y horario de la cita');
      return;
    }

    const dtInicio = parseFechaHora(form.fecha, form.horaInicio);
    const dtFin    = parseFechaHora(form.fecha, form.horaFin);

    if (isNaN(dtInicio.getTime()) || isNaN(dtFin.getTime())) {
      setApiError('Formato de hora inválido. Use el selector de hora.');
      return;
    }

    const fechaHoraInicio = dtInicio.toISOString();
    const fechaHoraFin    = dtFin.toISOString();

    if (new Date(fechaHoraFin) <= new Date(fechaHoraInicio)) {
      setApiError('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    mutCrear.mutate({
      pacienteId:      form.pacienteId,
      medicoId:        form.medicoId,
      tipoConsultaId:  form.tipoConsultaId,
      fechaHoraInicio,
      fechaHoraFin,
      ...(form.notasSecretaria && { notasSecretaria: form.notasSecretaria }),
    });
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/citas')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Citas
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-5">Nueva cita</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Búsqueda de paciente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
            {pacienteSeleccionado ? (
              <div className="flex items-center justify-between border border-green-300 bg-green-50 rounded px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{pacienteSeleccionado.nombreCompleto}</p>
                  <p className="text-xs text-gray-500">DPI: {pacienteSeleccionado.dpi}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPacienteSeleccionado(null); setForm(f => ({ ...f, pacienteId: '' })); }}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o DPI..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {pacientesResultados.length > 0 && busqueda.length >= 2 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {pacientesResultados.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => seleccionarPaciente(p)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                      >
                        <span className="font-medium">{p.nombreCompleto}</span>
                        <span className="text-gray-400 ml-2 text-xs">DPI: {p.dpi}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Médico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Médico *</label>
            <select
              name="medicoId"
              value={form.medicoId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar médico...</option>
              {medicos.map(m => (
                <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
              ))}
            </select>
          </div>

          {/* Tipo de consulta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de consulta *</label>
            <select
              name="tipoConsultaId"
              value={form.tipoConsultaId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar tipo...</option>
              {tiposConsulta.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre}{t.duracionMinutos && ` (${t.duracionMinutos} min)`}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha y horario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio *</label>
              <input
                type="time"
                name="horaInicio"
                value={form.horaInicio}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin *</label>
              <input
                type="time"
                name="horaFin"
                value={form.horaFin}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              name="notasSecretaria"
              value={form.notasSecretaria}
              onChange={handleChange}
              rows={2}
              placeholder="Indicaciones especiales, motivo de la visita..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {apiError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{apiError}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={mutCrear.isPending}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium"
            >
              {mutCrear.isPending ? 'Guardando...' : 'Agendar cita'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/citas')}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
