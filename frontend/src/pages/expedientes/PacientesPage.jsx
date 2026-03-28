import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, ChevronRight, FolderOpen, Clock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

function tiempoRelativo(fechaStr) {
  const ahora = new Date();
  const fecha  = new Date(fechaStr);
  const diffMs = ahora - fecha;
  const mins   = Math.floor(diffMs / 60000);
  const horas  = Math.floor(mins / 60);
  const dias   = Math.floor(horas / 24);

  if (mins < 2)    return 'hace un momento';
  if (mins < 60)   return `hace ${mins} min`;
  if (horas < 24)  return `hace ${horas} h`;
  if (dias === 1)  return 'ayer';
  if (dias < 7)    return `hace ${dias} días`;
  return fecha.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });
}

export default function PacientesPage() {
  const navigate = useNavigate();
  const [q, setQ]               = useState('');
  const [busqueda, setBusqueda] = useState('');

  const { data: resultados = [], isFetching } = useQuery({
    queryKey: ['pacientes-busqueda', busqueda],
    queryFn: () => api.get(`/pacientes?q=${encodeURIComponent(busqueda)}`).then(r => r.data),
    enabled: busqueda.length >= 2,
  });

  const { data: recientes = [] } = useQuery({
    queryKey: ['expedientes-recientes'],
    queryFn: () => api.get('/expedientes/recientes').then(r => r.data),
    enabled: busqueda.length < 2,
  });

  function handleBuscar(e) {
    e.preventDefault();
    setBusqueda(q);
  }

  const mostrarRecientes = busqueda.length < 2 && !isFetching;

  return (
    <div className="max-w-3xl space-y-5">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-400 mt-0.5">Busca por nombre o DPI</p>
        </div>
        <button
          onClick={() => navigate('/expedientes/nuevo')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo paciente
        </button>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleBuscar} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={e => { setQ(e.target.value); if (e.target.value === '') setBusqueda(''); }}
            placeholder="Buscar por nombre o DPI..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Resultados de búsqueda */}
      {isFetching ? (
        <p className="text-sm text-slate-400">Buscando...</p>
      ) : busqueda.length >= 2 && resultados.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl py-14 text-center">
          <FolderOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No se encontraron pacientes para "{busqueda}"</p>
        </div>
      ) : resultados.length > 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_130px_40px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
            {['Paciente', 'DPI', 'Teléfono', ''].map(col => (
              <p key={col} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{col}</p>
            ))}
          </div>
          <div className="divide-y divide-slate-50">
            {resultados.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/expedientes/paciente/${p.id}`)}
                className="grid grid-cols-[1fr_160px_130px_40px] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/70 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {iniciales(p.nombreCompleto)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.nombreCompleto}</p>
                    <p className="text-xs text-slate-400 capitalize">{p.sexo}</p>
                  </div>
                </div>
                <p className="text-xs font-mono text-slate-500">{p.dpi}</p>
                <p className="text-sm text-slate-500">{p.telefono || '—'}</p>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Actividad reciente */}
      {mostrarRecientes && recientes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Actividad reciente</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {recientes.map(exp => (
              <div
                key={exp.id}
                onClick={() => navigate(`/expedientes/paciente/${exp.paciente.id}`)}
                className="bg-white border border-slate-100 rounded-xl px-4 py-3.5 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {iniciales(exp.paciente.nombreCompleto)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{exp.paciente.nombreCompleto}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">{tiempoRelativo(exp.actualizadoEn)}</p>
                    {exp.tieneAlergias && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle className="w-3 h-3" />
                        Alergias
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado inicial vacío (sin recientes aún) */}
      {mostrarRecientes && recientes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400">Escribe al menos 2 caracteres para buscar</p>
        </div>
      )}
    </div>
  );
}
