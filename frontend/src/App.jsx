import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import PacientesPage from './pages/expedientes/PacientesPage';
import CrearPacientePage from './pages/expedientes/CrearPacientePage';
import ExpedientePage from './pages/expedientes/ExpedientePage';

function RutaProtegida({ roles, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={usuario ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Layout autenticado */}
      <Route element={<AppLayout />}>
        {/* Redirección raíz según rol */}
        <Route
          path="/"
          element={
            usuario ? (
              <Navigate
                to={
                  usuario.rol === 'administrador' ? '/admin/usuarios'
                  : usuario.rol === 'secretaria' ? '/citas'
                  : '/expedientes'
                }
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin */}
        <Route
          path="/admin/usuarios"
          element={
            <RutaProtegida roles={['administrador']}>
              <UsuariosPage />
            </RutaProtegida>
          }
        />

        {/* Expedientes — Sprint 3-4 */}
        <Route path="/expedientes" element={<PacientesPage />} />
        <Route path="/expedientes/nuevo" element={<CrearPacientePage />} />
        <Route path="/expedientes/paciente/:pacienteId" element={<ExpedientePage />} />

        <Route path="/citas" element={<Placeholder titulo="Citas" />} />
        <Route path="/reportes" element={<Placeholder titulo="Reportes" />} />
        <Route path="/auditoria" element={<Placeholder titulo="Auditoría" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Placeholder({ titulo }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-600">{titulo}</h2>
        <p className="text-sm text-gray-400 mt-1">Módulo disponible en próximo sprint</p>
      </div>
    </div>
  );
}
