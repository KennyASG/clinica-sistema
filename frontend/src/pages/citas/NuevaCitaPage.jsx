import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, UserCheck, X } from 'lucide-react';
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

const FORM_INICIAL = {
  pacienteId: '',
  medicoId: '',
  tipoConsultaId: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  notasSecretaria: '',
};

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const labelCls = 'block text-xs font-medium text-slate-500 mb-1.5';

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

  function buildISO(fecha, horaHHMM) {
    const [hh, mm] = horaHHMM.split(':').map(Number);
    const [yy, mo, dd] = fecha.split('-').map(Number);
    return new Date(yy, mo - 1, dd, hh, mm, 0).toISOString();
  }

  const slotsFin = form.horaInicio
    ? SLOTS_HORA.filter(s => s > form.horaInicio)
    : SLOTS_HORA;

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    if (!form.pacienteId)     { setApiError('Seleccione un paciente'); return; }
    if (!form.medicoId)       { setApiError('Seleccione un médico'); return; }
    if (!form.tipoConsultaId) { setApiError('Seleccione el tipo de consulta'); return; }
    if (!form.fecha)          { setApiError('Seleccione la fecha de la cita'); return; }
    if (!form.horaInicio)     { setApiError('Seleccione la hora de inicio'); return; }
    if (!form.horaFin)        { setApiError('Seleccione la hora de fin'); return; }

    mutCrear.mutate({
      pacienteId:      form.pacienteId,
      medicoId:        form.medicoId,
      tipoConsultaId:  form.tipoConsultaId,
      fechaHoraInicio: buildISO(form.fecha, form.horaInicio),
      fechaHoraFin:    buildISO(form.fecha, form.horaFin),
      ...(form.notasSecretaria && { notasSecretaria: form.notasSecretaria }),
    });
  }

  return (
    <div className="max-w-xl space-y-5">

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/citas')}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Citas
        </button>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Nueva cita</h1>
        <p className="text-sm text-slate-400 mt-0.5">Complete los datos para agendar una consulta</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Búsqueda de paciente */}
          <div>
            <label className={labelCls}>Paciente *</label>
            {pacienteSeleccionado ? (
              <div className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{pacienteSeleccionado.nombreCompleto}</p>
                    <p className="text-xs text-slate-400">DPI: {pacienteSeleccionado.dpi}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPacienteSeleccionado(null); setForm(f => ({ ...f, pacienteId: '' })); }}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o DPI..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className={inputCls}
                />
                {pacientesResultados.length > 0 && busqueda.length >= 2 && (
                  <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto py-1">
                    {pacientesResultados.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => seleccionarPaciente(p)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm transition-colors"
                      >
                        <span className="font-medium text-slate-800">{p.nombreCompleto}</span>
                        <span className="text-slate-400 ml-2 text-xs">DPI: {p.dpi}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Médico */}
          <div>
            <label className={labelCls}>Médico *</label>
            <select name="medicoId" value={form.medicoId} onChange={handleChange} className={inputCls}>
              <option value="">Seleccionar médico...</option>
              {medicos.map(m => (
                <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
              ))}
            </select>
          </div>

          {/* Tipo de consulta */}
          <div>
            <label className={labelCls}>Tipo de consulta *</label>
            <select name="tipoConsultaId" value={form.tipoConsultaId} onChange={handleChange} className={inputCls}>
              <option value="">Seleccionar tipo...</option>
              {tiposConsulta.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre}{t.duracionMinutos ? ` (${t.duracionMinutos} min)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className={labelCls}>Fecha *</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={inputCls}
            />
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Hora inicio *</label>
              <select
                name="horaInicio"
                value={form.horaInicio}
                onChange={e => {
                  const v = e.target.value;
                  setForm(f => ({
                    ...f,
                    horaInicio: v,
                    horaFin: f.horaFin && f.horaFin <= v ? '' : f.horaFin,
                  }));
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
                name="horaFin"
                value={form.horaFin}
                onChange={handleChange}
                disabled={!form.horaInicio}
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
              name="notasSecretaria"
              value={form.notasSecretaria}
              onChange={handleChange}
              rows={2}
              placeholder="Indicaciones especiales, motivo de la visita..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {apiError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={mutCrear.isPending}
              className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {mutCrear.isPending ? 'Guardando...' : 'Agendar cita'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/citas')}
              className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
