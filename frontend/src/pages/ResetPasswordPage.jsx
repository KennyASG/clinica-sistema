import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Activity } from 'lucide-react';
import api from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const token                       = searchParams.get('token') || '';

  const [password, setPassword]     = useState('');
  const [confirmar, setConfirmar]   = useState('');
  const [mostrar, setMostrar]       = useState(false);
  const [cargando, setCargando]     = useState(false);
  const [exito, setExito]           = useState(false);
  const [error, setError]           = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setExito(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'El enlace ha expirado o no es válido. Solicita uno nuevo.');
    } finally {
      setCargando(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl px-10 py-12 text-center">
          <p className="text-sm text-slate-400 mb-4">Enlace inválido o incompleto.</p>
          <Link to="/olvide-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl px-10 py-12">

        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-slate-800 tracking-wide">Clínica Médica</span>
        </div>

        {exito ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Contraseña actualizada</h1>
            <p className="text-sm text-slate-400">
              Serás redirigido al inicio de sesión en unos segundos.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Nueva contraseña</h1>
            <p className="text-sm text-slate-400 mb-8">
              Escribe tu nueva contraseña. Debe tener al menos 8 caracteres.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrar(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {mostrar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  {error}{' '}
                  {error.includes('expirado') && (
                    <Link to="/olvide-password" className="underline font-medium">
                      Solicitar uno nuevo
                    </Link>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando || !password || !confirmar}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
