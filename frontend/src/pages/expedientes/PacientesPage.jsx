import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

function useDebounce(value, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useState(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  });
  // uso correcto con useEffect
  return debounced;
}

export default function PacientesPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const { data: resultados = [], isFetching } = useQuery({
    queryKey: ['pacientes-busqueda', busqueda],
    queryFn: () => api.get(`/pacientes?q=${encodeURIComponent(busqueda)}`).then(r => r.data),
    enabled: busqueda.length >= 2,
  });

  function handleBuscar(e) {
    e.preventDefault();
    setBusqueda(q);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Pacientes</h1>
        <button
          onClick={() => navigate('/expedientes/nuevo')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Nuevo paciente
        </button>
      </div>

      {/* Barra de búsqueda */}
      <form onSubmit={handleBuscar} className="flex gap-2 mb-6">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre o DPI..."
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Buscar
        </button>
      </form>

      {/* Resultados */}
      {isFetching && (
        <p className="text-sm text-gray-400">Buscando...</p>
      )}

      {!isFetching && busqueda.length >= 2 && resultados.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p>No se encontraron pacientes para "{busqueda}"</p>
        </div>
      )}

      {resultados.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nombre completo</th>
                <th className="px-4 py-3 text-left">DPI</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Sexo</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resultados.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.nombreCompleto}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{p.dpi}</td>
                  <td className="px-4 py-3 text-gray-600">{p.telefono}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{p.sexo}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/expedientes/paciente/${p.id}`)}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Ver expediente →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {busqueda.length < 2 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
        </div>
      )}
    </div>
  );
}
