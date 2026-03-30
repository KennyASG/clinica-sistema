import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
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

export default function CrearPacientePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(FORM_INICIAL);
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
    // Filtrar campos vacíos opcionales
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    mutCrear.mutate(payload);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/expedientes')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Volver
        </button>
        <h1 className="text-xl font-bold text-gray-800">Nuevo paciente</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
        {/* Datos personales */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Nombre completo *" name="nombreCompleto" value={form.nombreCompleto} onChange={handleChange} required />
            </div>
            <Field label="DPI (13 dígitos) *" name="dpi" value={form.dpi} onChange={handleChange} required pattern="\d{13,15}" />
            <Field label="Fecha de nacimiento *" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
              <select name="sexo" value={form.sexo} onChange={handleChange} required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="">Seleccionar...</option>
                {SEXOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <Field label="Teléfono *" name="telefono" value={form.telefono} onChange={handleChange} required />
          </div>
        </section>

        {/* Contacto */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contacto y emergencia</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Correo electrónico" name="correo" type="email" value={form.correo} onChange={handleChange} />
            <Field label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} />
            <Field label="Contacto de emergencia" name="contactoEmergencia" value={form.contactoEmergencia} onChange={handleChange} />
            <Field label="Teléfono de emergencia" name="telefonoEmergencia" value={form.telefonoEmergencia} onChange={handleChange} />
          </div>
        </section>

        {/* Seguro */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Seguro médico (opcional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Seguro médico" name="seguroMedico" value={form.seguroMedico} onChange={handleChange} />
            <Field label="Número de póliza" name="numeroPoliza" value={form.numeroPoliza} onChange={handleChange} />
          </div>
        </section>

        {apiError && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{apiError}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/expedientes')}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
            Cancelar
          </button>
          <button type="submit" disabled={mutCrear.isPending}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium">
            {mutCrear.isPending ? 'Guardando...' : 'Crear paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, required = false, pattern }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} pattern={pattern}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
