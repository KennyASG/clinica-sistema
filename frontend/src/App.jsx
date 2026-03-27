import { Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      {/* Las rutas se agregan a medida que se implementan los sprints */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Sistema Clínica Médica</h1>
              <p className="mt-2 text-gray-500">Configuración inicial completada ✓</p>
            </div>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
