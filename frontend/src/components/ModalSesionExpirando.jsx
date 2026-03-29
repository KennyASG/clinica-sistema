import { useEffect, useState } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

// Muestra un contador regresivo de `segundos` hacia 0
function Contador({ segundos }) {
  const m = String(Math.floor(segundos / 60)).padStart(2, '0');
  const s = String(segundos % 60).padStart(2, '0');
  return (
    <span className="font-mono font-bold text-amber-600">
      {m}:{s}
    </span>
  );
}

export default function ModalSesionExpirando({ segundosRestantes, onRenovar, onCerrarSesion }) {
  const [cuenta, setCuenta] = useState(segundosRestantes);

  useEffect(() => {
    setCuenta(segundosRestantes);
  }, [segundosRestantes]);

  useEffect(() => {
    if (cuenta <= 0) return;
    const t = setTimeout(() => setCuenta(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cuenta]);

  // Cuando llega a 0 el padre ya habrá ejecutado el logout, pero por seguridad:
  useEffect(() => {
    if (cuenta <= 0) onCerrarSesion();
  }, [cuenta]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">¿Sigues ahí?</p>
            <p className="text-xs text-slate-500 mt-0.5">Tu sesión está por expirar</p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 text-center">
          <p className="text-sm text-slate-600">
            La sesión se cerrará automáticamente en
          </p>
          <div className="my-4 text-4xl">
            <Contador segundos={cuenta} />
          </div>
          <p className="text-xs text-slate-400">
            Haz clic en <span className="font-medium text-slate-600">Continuar</span> para renovar tu sesión.
          </p>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCerrarSesion}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
          <button
            onClick={onRenovar}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
