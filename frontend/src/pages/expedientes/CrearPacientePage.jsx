import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import api from '../../services/api';

const SEXOS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino',  label: 'Femenino' },
  { value: 'otro',      label: 'Otro' },
];

const FORM_INICIAL = {
  nombreCompleto: '', dpi: '', fechaNacimiento: '', sexo: '',
  telefono: '', telefonoEmergencia: '', contactoEmergencia: '',
  direccion: '', correo: '', seguroMedico: '', numeroPoliza: '',
};

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const labelCls = 'block text-xs font-medium text-slate-500 mb-1.5';

export default function CrearPacientePage() {
  const navigate = useNavigate();
  const [form, setForm]       = useState(FORM_INICIAL);
  const [apiError, setApiError] = useState('');

  const mutCrear = useMutation({
    mutationFn: (data) => api.post('/pacientes', data),
    onSuccess: (res) => navigate(`/expedientes/paciente/${res.data.id}`),
    onError: (err) => setApiError(err.response?.data?.message || 'Error al crear el paciente'),
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    mutCrear.mutate(payload);
  }

  return (
    <div className="max-w-2xl space-y-5">

      <button
        onClick={() => navigate('/expedientes')}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Pacientes
      </button>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Nuevo paciente</h1>
        <p className="text-sm text-slate-400 mt-0.5">Complete los datos para registrar el paciente</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Datos personales */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Datos personales</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Nombre completo *" name="nombreCompleto" value={form.nombreCompleto} onChange={handleChange} />
            </div>
            <Field label="DPI (13 dígitos) *" name="dpi" value={form.dpi} onChange={handleChange} pattern="\d{13,15}" />
            <Field label="Fecha de nacimiento *" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
            <div>
              <label className={labelCls}>Sexo *</label>
              <select name="sexo" value={form.sexo} onChange={handleChange} className={inputCls}>
                <option value="">Seleccionar...</option>
                {SEXOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <Field label="Teléfono *" name="telefono" value={form.telefono} onChange={handleChange} />
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contacto y emergencia</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Correo electrónico" name="correo" type="email" value={form.correo} onChange={handleChange} />
            <Field label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} />
            <Field label="Contacto de emergencia" name="contactoEmergencia" value={form.contactoEmergencia} onChange={handleChange} />
            <Field label="Teléfono de emergencia" name="telefonoEmergencia" value={form.telefonoEmergencia} onChange={handleChange} />
          </div>
        </div>

        {/* Seguro */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Seguro médico <span className="normal-case font-normal text-slate-300">(opcional)</span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Seguro médico" name="seguroMedico" value={form.seguroMedico} onChange={handleChange} />
            <Field label="Número de póliza" name="numeroPoliza" value={form.numeroPoliza} onChange={handleChange} />
          </div>
        </div>

        {apiError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
            {apiError}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={mutCrear.isPending}
            className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {mutCrear.isPending ? 'Guardando...' : 'Crear paciente'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/expedientes')}
            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, pattern }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        pattern={pattern}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}
