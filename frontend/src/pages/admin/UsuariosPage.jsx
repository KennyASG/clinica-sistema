import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const ROLES = ['administrador', 'medico', 'enfermera', 'secretaria'];

const FORM_VACIO = {
  nombreCompleto: '', email: '', password: '', rol: 'secretaria',
  numeroColegiado: '', telefono: '',
};

export default function UsuariosPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | { modo: 'crear'|'editar', usuario?: object }
  const [form, setForm] = useState(FORM_VACIO);
  const [apiError, setApiError] = useState('');

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then((r) => r.data),
  });

  const mutCrear = useMutation({
    mutationFn: (data) => api.post('/usuarios', data),
    onSuccess: () => { qc.invalidateQueries(['usuarios']); cerrarModal(); },
    onError: (err) => setApiError(err.response?.data?.message || 'Error al crear'),
  });

  const mutEditar = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/usuarios/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['usuarios']); cerrarModal(); },
    onError: (err) => setApiError(err.response?.data?.message || 'Error al guardar'),
  });

  function abrirCrear() {
    setForm(FORM_VACIO);
    setApiError('');
    setModal({ modo: 'crear' });
  }

  function abrirEditar(u) {
    setForm({ nombreCompleto: u.nombreCompleto, email: u.email, password: '', rol: u.rol, numeroColegiado: u.numeroColegiado || '', telefono: u.telefono || '' });
    setApiError('');
    setModal({ modo: 'editar', usuario: u });
  }

  function cerrarModal() { setModal(null); }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    if (modal.modo === 'crear') {
      mutCrear.mutate(form);
    } else {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      mutEditar.mutate({ id: modal.usuario.id, data: payload });
    }
  }

  async function toggleActivo(u) {
    mutEditar.mutate({ id: u.id, data: { activo: !u.activo } });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Gestión de usuarios</h1>
        <button
          onClick={abrirCrear}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Nuevo usuario
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Último acceso</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.nombreCompleto}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-GT') : '—'}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => abrirEditar(u)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActivo(u)}
                      className="text-gray-500 hover:underline text-xs"
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {modal.modo === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Nombre completo" name="nombreCompleto" value={form.nombreCompleto} onChange={handleChange} required />
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
              <Field
                label={modal.modo === 'crear' ? 'Contraseña' : 'Nueva contraseña (dejar vacío para no cambiar)'}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required={modal.modo === 'crear'}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  name="rol"
                  value={form.rol}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <Field label="N° Colegiado (médicos)" name="numeroColegiado" value={form.numeroColegiado} onChange={handleChange} />
              <Field label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />

              {apiError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{apiError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutCrear.isPending || mutEditar.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium"
                >
                  {mutCrear.isPending || mutEditar.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
