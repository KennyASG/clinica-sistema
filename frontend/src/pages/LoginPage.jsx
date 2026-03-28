import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Activity } from 'lucide-react';

const RUTA_POR_ROL = {
  administrador: '/admin/usuarios',
  medico:        '/expedientes',
  enfermera:     '/expedientes',
  secretaria:    '/citas',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const perfil = await login(form.email, form.password);
      navigate(RUTA_POR_ROL[perfil.rol] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex min-h-[520px]">

        {/* Panel izquierdo — formulario */}
        <div className="flex-1 flex flex-col justify-center px-10 py-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-slate-800 tracking-wide">Clínica Médica</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Bienvenido</h1>
          <p className="text-sm text-slate-400 mb-8">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="correo@clinica.gt"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {mostrarPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Panel derecho — ilustración */}
        <div className="hidden md:flex w-80 bg-indigo-600 flex-col items-center justify-center px-8 text-center gap-7">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
                <Activity className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <div className="absolute -top-1 right-0 w-3 h-3 bg-indigo-300 rounded-full" />
            <div className="absolute bottom-0 -left-2 w-2 h-2 bg-indigo-200 rounded-full opacity-70" />
          </div>

          <div>
            <h2 className="text-white font-bold text-lg leading-snug">
              Sistema de Gestión Clínica
            </h2>
            <p className="text-indigo-200 text-xs mt-2 leading-relaxed">
              Expedientes digitales, citas y seguimiento de pacientes en un solo lugar.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full">
            {['Expedientes digitales', 'Control de citas', 'Historial médico'].map(item => (
              <div
                key={item}
                className="bg-white/10 rounded-lg px-3 py-2 text-xs text-indigo-100 font-medium text-left"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
