import { useState, useRef, useEffect } from 'react';

const CIE10_COMUNES = [
  { codigo: 'J06.9',  descripcion: 'Infección aguda de vías respiratorias superiores' },
  { codigo: 'J00',    descripcion: 'Rinofaringitis aguda (resfriado común)' },
  { codigo: 'J03.9',  descripcion: 'Amigdalitis aguda' },
  { codigo: 'J45.9',  descripcion: 'Asma, no especificada' },
  { codigo: 'A09',    descripcion: 'Diarrea y gastroenteritis de origen infeccioso' },
  { codigo: 'K21.0',  descripcion: 'Enfermedad por reflujo gastroesofágico (ERGE)' },
  { codigo: 'K29.7',  descripcion: 'Gastritis crónica' },
  { codigo: 'I10',    descripcion: 'Hipertensión esencial' },
  { codigo: 'E11.9',  descripcion: 'Diabetes mellitus tipo 2 sin complicaciones' },
  { codigo: 'E78.5',  descripcion: 'Hiperlipidemia' },
  { codigo: 'M54.5',  descripcion: 'Lumbalgia' },
  { codigo: 'M54.2',  descripcion: 'Cervicalgia' },
  { codigo: 'N39.0',  descripcion: 'Infección de vías urinarias' },
  { codigo: 'R51',    descripcion: 'Cefalea' },
  { codigo: 'R50.9',  descripcion: 'Fiebre, no especificada' },
  { codigo: 'L20.9',  descripcion: 'Dermatitis atópica' },
  { codigo: 'F32.9',  descripcion: 'Episodio depresivo, no especificado' },
  { codigo: 'F41.1',  descripcion: 'Trastorno de ansiedad generalizada' },
  { codigo: 'Z00.0',  descripcion: 'Examen médico general (chequeo)' },
  { codigo: 'B34.9',  descripcion: 'Infección viral, no especificada' },
];

export default function CIE10Input({ value, onChange }) {
  const [texto, setTexto] = useState(value || '');
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  const filtrados = texto.length >= 1
    ? CIE10_COMUNES.filter(c =>
        c.codigo.toLowerCase().includes(texto.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(texto.toLowerCase())
      )
    : CIE10_COMUNES;

  useEffect(() => {
    function clickFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', clickFuera);
    return () => document.removeEventListener('mousedown', clickFuera);
  }, []);

  function seleccionar(codigo) {
    setTexto(codigo);
    onChange(codigo);
    setAbierto(false);
  }

  function handleChange(e) {
    const v = e.target.value.toUpperCase();
    setTexto(v);
    onChange(v);
    setAbierto(true);
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={texto}
        onChange={handleChange}
        onFocus={() => setAbierto(true)}
        placeholder="Ej: J06.9 o escribe diagnóstico"
        maxLength={10}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {abierto && filtrados.length > 0 && (
        <div className="absolute z-30 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-52 overflow-y-auto">
          {filtrados.map(c => (
            <button
              key={c.codigo}
              type="button"
              onMouseDown={() => seleccionar(c.codigo)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex gap-3"
            >
              <span className="font-mono text-blue-700 font-medium w-14 flex-shrink-0">{c.codigo}</span>
              <span className="text-gray-600 truncate">{c.descripcion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
