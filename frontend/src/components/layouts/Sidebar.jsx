import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_POR_ROL = {
  administrador: [
    { to: '/admin/usuarios', label: 'Usuarios' },
    { to: '/expedientes', label: 'Expedientes' },
    { to: '/citas', label: 'Citas' },
    { to: '/reportes', label: 'Reportes' },
    { to: '/auditoria', label: 'Auditoría' },
  ],
  medico: [
    { to: '/expedientes', label: 'Expedientes' },
    { to: '/citas', label: 'Mis citas' },
  ],
  enfermera: [
    { to: '/expedientes', label: 'Expedientes' },
    { to: '/citas', label: 'Agenda' },
  ],
  secretaria: [
    { to: '/citas', label: 'Citas' },
    { to: '/expedientes', label: 'Pacientes' },
  ],
};

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const links = NAV_POR_ROL[usuario?.rol] ?? [];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-blue-800 text-white flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-blue-700">
        <p className="font-bold text-sm">Clínica Médica</p>
        <p className="text-xs text-blue-300 truncate mt-0.5">{usuario?.nombre}</p>
        <span className="inline-block mt-1 text-xs bg-blue-600 rounded px-2 py-0.5 capitalize">
          {usuario?.rol}
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="m-3 text-sm text-blue-300 hover:text-white py-2 px-3 rounded hover:bg-blue-700 text-left"
      >
        Cerrar sesión
      </button>
    </aside>
  );
}
