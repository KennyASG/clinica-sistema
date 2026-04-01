import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
        <footer className="px-6 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">
            Sistema de Gestión Clínica Medica &copy; {new Date().getFullYear()} Kenny Saenz. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
