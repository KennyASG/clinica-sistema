import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/layouts/PageHeader';
import api from '../../services/api';

function hoy() { return new Date().toISOString().split('T')[0]; }
function inicioMes() {
  const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
}

const ACCION_CONFIG = {
  INSERT:  { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  UPDATE:  { cls: 'bg-indigo-50 text-indigo-600 border border-indigo-200' },
  DELETE:  { cls: 'bg-red-50 text-red-500 border border-red-200' },
  LOGIN:   { cls: 'bg-violet-50 text-violet-600 border border-violet-200' },
  LOGOUT:  { cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

const ACCIONES = ['', 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
const TABLAS   = ['', 'usuario', 'paciente', 'expediente', 'cita', 'consulta', 'signosVitales'];

export default function AuditoriaPage() {
  const [desde, setDesde]       = useState(inicioMes());
  const [hasta, setHasta]       = useState(hoy());
  const [accion, setAccion]     = useState('');
  const [tabla, setTabla]       = useState('');
  const [page, setPage]         = useState(1);
  const [detalle, setDetalle]   = useState(null);

  const params = new URLSearchParams({ desde, hasta, page, limit: 50 });
  if (accion) params.set('accion', accion);
  if (tabla)  params.set('tabla', tabla);

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria', desde, hasta, accion, tabla, page],
    queryFn: () => api.get(`/auditoria?${params}`).then(r => r.data),
  });

  const registros = data?.registros ?? [];
  const totalPags = data?.pages ?? 1;

  function fmtFecha(d) {
    return new Date(d).toLocaleDateString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  return (
    <div className="max-w-5xl space-y-5">

      <PageHeader
        titulo="Auditoría"
        subtitulo="Bitácora de cambios del sistema"
      />

      {/* Filtros */}
      <div className="bg-white border border-slate-100 rounded-xl px-5 py-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Desde</label>
            <input
              type="date" value={desde}
              onChange={e => { setDesde(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Hasta</label>
            <input
              type="date" value={hasta}
              onChange={e => { setHasta(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Acción</label>
            <select
              value={accion}
              onChange={e => { setAccion(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ACCIONES.map(a => <option key={a} value={a}>{a || 'Todas'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Tabla</label>
            <select
              value={tabla}
              onChange={e => { setTabla(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TABLAS.map(t => <option key={t} value={t}>{t || 'Todas'}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <span className="text-sm text-slate-500 font-medium">
            {data ? `${data.total} registros` : '…'}
          </span>
          {totalPags > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500">{page} / {totalPags}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPags, p + 1))}
                disabled={page === totalPags}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:grid grid-cols-[170px_130px_100px_120px_1fr] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
          {['Fecha', 'Usuario', 'Acción', 'Tabla', 'IP'].map(col => (
            <p key={col} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{col}</p>
          ))}
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">Cargando bitácora...</p>
          </div>
        ) : registros.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Sin registros para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {registros.map(r => {
              const accionCfg = ACCION_CONFIG[r.accion] ?? { cls: 'bg-slate-100 text-slate-500 border border-slate-200' };
              const tieneDetalle = r.datosAnteriores || r.datosNuevos;
              return (
                <div
                  key={r.id}
                  onClick={() => tieneDetalle && setDetalle(detalle?.id === r.id ? null : r)}
                  className={`transition-colors ${tieneDetalle ? 'cursor-pointer hover:bg-slate-50/70' : ''} ${detalle?.id === r.id ? 'bg-indigo-50/50' : ''}`}
                >
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-[170px_130px_100px_120px_1fr] gap-4 px-5 py-3 items-center">
                    <p className="text-xs font-mono text-slate-500">{fmtFecha(r.fechaHora)}</p>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{r.usuario?.nombreCompleto}</p>
                      <p className="text-xs text-slate-400 capitalize">{r.usuario?.rol}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${accionCfg.cls}`}>
                      {r.accion}
                    </span>
                    <p className="text-xs text-slate-500 font-mono">{r.tablaAfectada ?? '—'}</p>
                    <p className="text-xs font-mono text-slate-400">{r.ipAddress ?? '—'}</p>
                  </div>
                  {/* Móvil */}
                  <div className="md:hidden flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${accionCfg.cls}`}>
                          {r.accion}
                        </span>
                        <p className="text-xs font-mono text-slate-500">{r.tablaAfectada ?? '—'}</p>
                      </div>
                      <p className="text-xs font-medium text-slate-700 truncate mt-0.5">{r.usuario?.nombreCompleto}</p>
                      <p className="text-xs font-mono text-slate-400">{fmtFecha(r.fechaHora)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel de detalle JSON */}
      {detalle && (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">
              Detalle — {detalle.accion} en {detalle.tablaAfectada}
            </p>
            <button
              onClick={() => setDetalle(null)}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100"
            >
              Cerrar
            </button>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <JSONPanel titulo="Antes" data={detalle.datosAnteriores} />
            <JSONPanel titulo="Después" data={detalle.datosNuevos} />
          </div>
        </div>
      )}
    </div>
  );
}

function JSONPanel({ titulo, data }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{titulo}</p>
      {data ? (
        <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2.5 overflow-x-auto font-mono leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="text-xs text-slate-300 italic">—</p>
      )}
    </div>
  );
}
