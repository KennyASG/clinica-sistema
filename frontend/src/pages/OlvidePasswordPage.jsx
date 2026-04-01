import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Activity, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function OlvidePasswordPage() {
  const [email, setEmail]       = useState('');
  const [enviado, setEnviado]   = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setEnviado(true);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
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

        {enviado ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Revisa tu correo</h1>
            <p className="text-sm text-slate-400 mb-6">
              Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
              El enlace es válido por <strong className="text-slate-600">15 minutos</strong>.
            </p>
            <Link
              to="/login"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Restablecer contraseña</h1>
            <p className="text-sm text-slate-400 mb-8">
              Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>

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
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="correo@clinica.gt"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando || !email}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {cargando ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            <Link
              to="/login"
              className="flex items-center gap-1.5 mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
