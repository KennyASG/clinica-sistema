import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import OlvidePasswordPage from './pages/OlvidePasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import ReportesPage from './pages/admin/ReportesPage';
import AuditoriaPage from './pages/admin/AuditoriaPage';
import PacientesPage from './pages/expedientes/PacientesPage';
import CrearPacientePage from './pages/expedientes/CrearPacientePage';
import ExpedientePage from './pages/expedientes/ExpedientePage';
import CitasPage from './pages/citas/CitasPage';
import NuevaCitaPage from './pages/citas/NuevaCitaPage';

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
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/olvide-password" element={usuario ? <Navigate to="/" replace /> : <OlvidePasswordPage />} />
      <Route path="/reset-password" element={usuario ? <Navigate to="/" replace /> : <ResetPasswordPage />} />

      <Route element={<AppLayout />}>
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
        <Route path="/admin/usuarios" element={
          <RutaProtegida roles={['administrador']}><UsuariosPage /></RutaProtegida>
        } />

        {/* Reportes y auditoría */}
        <Route path="/reportes" element={
          <RutaProtegida roles={['administrador', 'medico']}><ReportesPage /></RutaProtegida>
        } />
        <Route path="/auditoria" element={
          <RutaProtegida roles={['administrador']}><AuditoriaPage /></RutaProtegida>
        } />

        {/* Expedientes */}
        <Route path="/expedientes" element={<PacientesPage />} />
        <Route path="/expedientes/nuevo" element={<CrearPacientePage />} />
        <Route path="/expedientes/paciente/:pacienteId" element={<ExpedientePage />} />

        {/* Citas */}
        <Route path="/citas" element={<CitasPage />} />
        <Route path="/citas/nueva" element={<NuevaCitaPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
