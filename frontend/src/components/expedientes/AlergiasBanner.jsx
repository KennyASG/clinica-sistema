import { AlertTriangle } from 'lucide-react';

export default function AlergiasBanner({ alergias }) {
  if (!alergias) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5">
      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 text-red-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-red-700">Alerta de alergias</p>
        <p className="text-sm text-red-600 mt-0.5 whitespace-pre-line">{alergias}</p>
      </div>
    </div>
  );
}
