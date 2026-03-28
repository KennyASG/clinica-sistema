import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { usuario } = useAuth();

  // usuario se pone en null en cuanto limpiarSesion() corre
  // (disparado por evento auth:expired o por el check periódico)
  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
