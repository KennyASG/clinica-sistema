import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X, Pencil, MoreHorizontal } from 'lucide-react';
import api from '../../services/api';

const ROLES = ['administrador', 'medico', 'enfermera', 'secretaria'];

const ROL_CONFIG = {
  administrador: { cls: 'bg-violet-50 text-violet-600 border border-violet-200' },
  medico:        { cls: 'bg-indigo-50 text-indigo-600 border border-indigo-200' },
  enfermera:     { cls: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
  secretaria:    { cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
};

const FORM_VACIO = {
  nombreCompleto: '', email: '', password: '', rol: 'secretaria',
  numeroColegiado: '', telefono: '', especialidadIds: [],
};

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const labelCls = 'block text-xs font-medium text-slate-500 mb-1.5';

export default function UsuariosPage() {
  const qc = useQueryClient();
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(FORM_VACIO);
  const [apiError, setApiError] = useState('');

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then(r => r.data),
  });

  const { data: especialidades = [] } = useQuery({
    queryKey: ['especialidades'],
    queryFn: () => api.get('/especialidades').then(r => r.data),
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
    setForm({
      nombreCompleto: u.nombreCompleto,
      email: u.email,
      password: '',
      rol: u.rol,
      numeroColegiado: u.numeroColegiado || '',
      telefono: u.telefono || '',
      especialidadIds: (u.especialidades || []).map(e => e.especialidad.id),
    });
    setApiError('');
    setModal({ modo: 'editar', usuario: u });
  }

  function cerrarModal() { setModal(null); }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function toggleEspecialidad(id) {
    setForm(f => ({
      ...f,
      especialidadIds: f.especialidadIds.includes(id)
        ? f.especialidadIds.filter(x => x !== id)
        : [...f.especialidadIds, id],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    if (payload.rol !== 'medico') delete payload.especialidadIds;
    if (modal.modo === 'crear') {
      mutCrear.mutate(payload);
    } else {
      mutEditar.mutate({ id: modal.usuario.id, data: payload });
    }
  }

  function toggleActivo(u) {
    mutEditar.mutate({ id: u.id, data: { activo: !u.activo } });
  }

  return (
    <div className="max-w-5xl space-y-5">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-400 mt-0.5">{usuarios.length} usuarios registrados</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_200px_120px_100px_160px_80px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
          {['Usuario', 'Email', 'Rol', 'Estado', 'Último acceso', ''].map(col => (
            <p key={col} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{col}</p>
          ))}
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">Cargando...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {usuarios.map(u => (
              <FilaUsuario
                key={u.id}
                usuario={u}
                onEditar={() => abrirEditar(u)}
                onToggle={() => toggleActivo(u)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-base font-semibold text-slate-900">
                {modal.modo === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
              </h2>
              <button
                onClick={cerrarModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                <CampoInput label="Nombre completo" name="nombreCompleto" value={form.nombreCompleto} onChange={handleChange} />
                <CampoInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
                <CampoInput
                  label={modal.modo === 'crear' ? 'Contraseña' : 'Nueva contraseña (vacío = sin cambio)'}
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                />
                <div>
                  <label className={labelCls}>Rol</label>
                  <select name="rol" value={form.rol} onChange={handleChange} className={inputCls}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {form.rol === 'medico' && (
                  <>
                    <CampoInput label="N° Colegiado" name="numeroColegiado" value={form.numeroColegiado} onChange={handleChange} />
                    <div>
                      <label className={labelCls}>Especialidades</label>
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                        {especialidades.length === 0 ? (
                          <p className="px-3 py-2.5 text-sm text-slate-400">No hay especialidades registradas</p>
                        ) : (
                          especialidades.map(esp => {
                            const checked = form.especialidadIds.includes(esp.id);
                            const esPrincipal = form.especialidadIds[0] === esp.id;
                            return (
                              <label
                                key={esp.id}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleEspecialidad(esp.id)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-700 flex-1">{esp.nombre}</span>
                                {checked && esPrincipal && (
                                  <span className="text-xs text-indigo-500 font-medium">Principal</span>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                      {form.especialidadIds.length > 1 && (
                        <p className="text-xs text-slate-400 mt-1.5">La primera seleccionada se marca como principal.</p>
                      )}
                    </div>
                  </>
                )}

                <CampoInput label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />

                {apiError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">{apiError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0">
                <button type="button" onClick={cerrarModal}
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutCrear.isPending || mutEditar.isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
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

function FilaUsuario({ usuario: u, onEditar, onToggle }) {
  const [menu, setMenu] = useState(false);
  const rolCfg = ROL_CONFIG[u.rol] ?? { cls: 'bg-slate-100 text-slate-500 border border-slate-200' };
  const ultimoAcceso = u.ultimoAcceso
    ? new Date(u.ultimoAcceso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const especialidadPrincipal = u.especialidades?.find(e => e.esPrincipal)?.especialidad?.nombre
    || u.especialidades?.[0]?.especialidad?.nombre;

  return (
    <div className={`grid grid-cols-[1fr_200px_120px_100px_160px_80px] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/70 transition-colors ${!u.activo ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {iniciales(u.nombreCompleto)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{u.nombreCompleto}</p>
          {u.rol === 'medico' && especialidadPrincipal ? (
            <p className="text-xs text-slate-400 truncate">{especialidadPrincipal}</p>
          ) : u.numeroColegiado ? (
            <p className="text-xs text-slate-400">Col. {u.numeroColegiado}</p>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-slate-500 truncate">{u.email}</p>

      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${rolCfg.cls}`}>
        {u.rol}
      </span>

      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        u.activo
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-slate-100 text-slate-400 border border-slate-200'
      }`}>
        {u.activo ? 'Activo' : 'Inactivo'}
      </span>

      <p className="text-xs text-slate-400">{ultimoAcceso}</p>

      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => setMenu(m => !m)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <button
                  onClick={() => { setMenu(false); onEditar(); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => { setMenu(false); onToggle(); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CampoInput({ label, name, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}
