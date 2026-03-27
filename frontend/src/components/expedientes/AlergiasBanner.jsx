export default function AlergiasBanner({ alergias }) {
  if (!alergias) return null;
  return (
    <div className="bg-red-600 text-white rounded-lg px-5 py-4 mb-6 flex gap-3 items-start shadow-md">
      <span className="text-2xl mt-0.5">⚠️</span>
      <div>
        <p className="font-bold text-lg leading-tight">ALERTA DE ALERGIAS</p>
        <p className="text-red-100 mt-1 text-sm whitespace-pre-line">{alergias}</p>
      </div>
    </div>
  );
}
