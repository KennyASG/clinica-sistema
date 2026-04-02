import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Download, Search, Users, Calendar } from 'lucide-react';
import PageHeader from '../../components/layouts/PageHeader';
import api from '../../services/api';

function hoy() { return new Date().toISOString().split('T')[0]; }
function inicioMes() {
  const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
}

const ESTADO_CONFIG = {
  pendiente:     { label: 'Pendiente',      cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  confirmada:    { label: 'Confirmada',     cls: 'bg-violet-50 text-violet-600 border border-violet-200' },
  en_atencion:   { label: 'En atención',    cls: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
  atendida:      { label: 'Atendida',       cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelada:     { label: 'Cancelada',      cls: 'bg-red-50 text-red-500 border border-red-200' },
  no_presentada: { label: 'No se presentó', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

const TABS = ['citas', 'pacientes'];

export default function ReportesPage() {
  const [tab, setTab]           = useState('citas');
  const [desde, setDesde]       = useState(inicioMes());
  const [hasta, setHasta]       = useState(hoy());
  const [medicoId, setMedicoId] = useState('');
  const [estado, setEstado]     = useState('');
  const [buscar, setBuscar]     = useState(false);

  const { data: medicos = [] } = useQuery({
    queryKey: ['medicos'],
    queryFn: () => api.get('/medicos').then(r => r.data),
  });

  const params = new URLSearchParams({ desde, hasta });
  if (medicoId) params.set('medicoId', medicoId);
  if (estado && tab === 'citas') params.set('estado', estado);

  const { data: reporteCitas, isLoading: loadCitas } = useQuery({
    queryKey: ['reporte-citas', desde, hasta, medicoId, estado],
    queryFn: () => api.get(`/reportes/citas?${params}`).then(r => r.data),
    enabled: buscar && tab === 'citas',
  });

  const { data: reportePacientes, isLoading: loadPac } = useQuery({
    queryKey: ['reporte-pacientes', desde, hasta, medicoId],
    queryFn: () => api.get(`/reportes/pacientes?${params}`).then(r => r.data),
    enabled: buscar && tab === 'pacientes',
  });

  function handleBuscar(e) { e.preventDefault(); setBuscar(true); }

  async function descargarPDF() {
    const endpoint = tab === 'citas' ? '/reportes/citas/pdf' : '/reportes/pacientes/pdf';
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || `Error al generar el PDF (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `reporte-${tab}-${desde}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo conectar con el servidor. Intenta de nuevo.');
    }
  }

  const isLoading = tab === 'citas' ? loadCitas : loadPac;
  const data      = tab === 'citas' ? reporteCitas : reportePacientes;

  return (
    <div className="max-w-5xl space-y-5">

      <PageHeader
        titulo="Reportes"
        subtitulo="Análisis de citas y pacientes atendidos"
        accion={
          buscar && data && (
            <button
              onClick={descargarPDF}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setBuscar(false); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'citas' ? 'Citas' : 'Pacientes atendidos'}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <form onSubmit={handleBuscar} className="bg-white border border-slate-100 rounded-xl px-5 py-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Desde</label>
            <input
              type="date" value={desde} onChange={e => { setDesde(e.target.value); setBuscar(false); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Hasta</label>
            <input
              type="date" value={hasta} onChange={e => { setHasta(e.target.value); setBuscar(false); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Médico</label>
            <select
              value={medicoId} onChange={e => { setMedicoId(e.target.value); setBuscar(false); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos</option>
              {medicos.map(m => <option key={m.id} value={m.id}>{m.nombreCompleto}</option>)}
            </select>
          </div>
          {tab === 'citas' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Estado</label>
              <select
                value={estado} onChange={e => { setEstado(e.target.value); setBuscar(false); }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                {Object.entries(ESTADO_CONFIG).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            Generar reporte
          </button>
        </div>
      </form>

      {/* Resultados */}
      {isLoading && <p className="text-sm text-slate-400 text-center py-8">Generando reporte...</p>}

      {data && !isLoading && (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-3 gap-4">
            <TarjetaMetrica
              titulo="Total"
              valor={data.total}
              icono={<Calendar className="w-5 h-5 text-indigo-500" />}
            />
            {tab === 'citas' && data.resumen && Object.entries(data.resumen).slice(0, 2).map(([estado, count]) => (
              <TarjetaMetrica
                key={estado}
                titulo={ESTADO_CONFIG[estado]?.label ?? estado}
                valor={count}
                icono={<BarChart2 className="w-5 h-5 text-slate-400" />}
              />
            ))}
            {tab === 'pacientes' && data.porMedico && (
              <TarjetaMetrica
                titulo="Médicos activos"
                valor={Object.keys(data.porMedico).length}
                icono={<Users className="w-5 h-5 text-emerald-500" />}
              />
            )}
          </div>

          {/* Tabla */}
          {tab === 'citas' ? (
            <TablaCitas citas={data.citas} />
          ) : (
            <TablaPacientes consultas={data.consultas} porMedico={data.porMedico} />
          )}
        </>
      )}

      {buscar && !data && !isLoading && (
        <div className="bg-white border border-slate-100 rounded-xl py-14 text-center">
          <BarChart2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Sin resultados para el período seleccionado</p>
        </div>
      )}
    </div>
  );
}

function TarjetaMetrica({ titulo, valor, icono }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">{icono}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{valor}</p>
        <p className="text-xs text-slate-400 mt-0.5">{titulo}</p>
      </div>
    </div>
  );
}

function TablaCitas({ citas }) {
  const fmtFecha = d => new Date(d).toLocaleDateString('es-GT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[160px_1fr_1fr_120px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
        {['Fecha / Hora', 'Paciente', 'Médico', 'Estado'].map(col => (
          <p key={col} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{col}</p>
        ))}
      </div>
      <div className="divide-y divide-slate-50">
        {citas.map(c => {
          const cfg = ESTADO_CONFIG[c.estado] ?? { label: c.estado, cls: 'bg-slate-100 text-slate-500 border border-slate-200' };
          return (
            <div key={c.id} className="grid grid-cols-[160px_1fr_1fr_120px] gap-4 px-5 py-3 items-center">
              <p className="text-xs font-mono text-slate-500">{fmtFecha(c.fechaHoraInicio)}</p>
              <p className="text-sm text-slate-700 truncate">{c.paciente?.nombreCompleto}</p>
              <p className="text-sm text-slate-500 truncate">Dr. {c.medico?.nombreCompleto}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TablaPacientes({ consultas, porMedico }) {
  return (
    <div className="space-y-4">
      {/* Resumen por médico */}
      {porMedico && Object.keys(porMedico).length > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Consultas por médico</p>
          </div>
          <div className="divide-y divide-slate-50">
            {Object.entries(porMedico).map(([medico, total]) => (
              <div key={medico} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm text-slate-700">Dr. {medico}</p>
                <span className="text-sm font-semibold text-indigo-600">{total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de consultas */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_1fr_100px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
          {['Fecha', 'Paciente', 'Médico', 'CIE-10'].map(col => (
            <p key={col} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{col}</p>
          ))}
        </div>
        <div className="divide-y divide-slate-50">
          {consultas.map(c => (
            <div key={c.id} className="grid grid-cols-[120px_1fr_1fr_100px] gap-4 px-5 py-3 items-center">
              <p className="text-xs font-mono text-slate-500">
                {new Date(c.fechaHora).toLocaleDateString('es-GT')}
              </p>
              <p className="text-sm text-slate-700 truncate">{c.expediente?.paciente?.nombreCompleto}</p>
              <p className="text-sm text-slate-500 truncate">Dr. {c.medico?.nombreCompleto}</p>
              <p className="text-xs font-mono text-indigo-600">{c.diagnosticoCie10 || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
