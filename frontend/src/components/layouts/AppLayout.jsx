import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Menu, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { usuario } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Activity className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-slate-800">Clínica Médica</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
        <footer className="px-4 md:px-6 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">
            Sistema de Gestión Clínica Medica &copy; {new Date().getFullYear()} Kenny Saenz. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
