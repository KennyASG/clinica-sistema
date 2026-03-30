import { Stethoscope } from 'lucide-react';

/**
 * Encabezado oscuro unificado para las pantallas principales.
 * Uso:
 *   <PageHeader
 *     titulo="Pacientes"
 *     subtitulo="Busca por nombre o DPI"
 *     accion={<button>...</button>}
 *   />
 */
export default function PageHeader({ titulo, subtitulo, accion }) {
  return (
    <div className="relative bg-slate-800 rounded-2xl px-6 py-5 overflow-hidden flex items-center justify-between gap-4">
      {/* Estetoscopio marca de agua */}
      <Stethoscope
        className="absolute -right-5 -bottom-5 text-white pointer-events-none"
        style={{ width: 148, height: 148, opacity: 0.07 }}
        strokeWidth={1}
      />

      {/* Título */}
      <div className="relative z-10 min-w-0">
        <h1 className="text-lg font-bold text-white leading-tight">{titulo}</h1>
        {subtitulo && (
          <p className="text-sm text-slate-400 mt-0.5 truncate">{subtitulo}</p>
        )}
      </div>

      {/* Acción opcional */}
      {accion && (
        <div className="relative z-10 flex-shrink-0">{accion}</div>
      )}
    </div>
  );
}
