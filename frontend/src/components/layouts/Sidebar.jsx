import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity, LayoutDashboard, Users, CalendarDays,
  FolderOpen, BarChart2, ClipboardList, LogOut, Settings,
} from 'lucide-react';

const NAV_POR_ROL = {
  administrador: [
    { to: '/admin/usuarios', label: 'Usuarios',     icon: Users },
    { to: '/expedientes',   label: 'Expedientes',   icon: FolderOpen },
    { to: '/citas',         label: 'Citas',         icon: CalendarDays },
    { to: '/reportes',      label: 'Reportes',      icon: BarChart2 },
    { to: '/auditoria',     label: 'Auditoría',     icon: ClipboardList },
  ],
  medico: [
    { to: '/expedientes', label: 'Expedientes', icon: FolderOpen },
    { to: '/citas',       label: 'Mis citas',   icon: CalendarDays },
  ],
  enfermera: [
    { to: '/expedientes', label: 'Expedientes', icon: FolderOpen },
    { to: '/citas',       label: 'Agenda',      icon: CalendarDays },
  ],
  secretaria: [
    { to: '/citas',       label: 'Citas',      icon: CalendarDays },
    { to: '/expedientes', label: 'Pacientes',  icon: FolderOpen },
  ],
};

const ROL_LABEL = {
  administrador: 'Administrador',
  medico:        'Médico',
  enfermera:     'Enfermera',
  secretaria:    'Secretaria',
};

function Iniciales({ nombre }) {
  const partes = (nombre || '').split(' ');
  const ini = partes.length >= 2
    ? partes[0][0] + partes[1][0]
    : (partes[0] || 'U').slice(0, 2);
  return ini.toUpperCase();
}

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_POR_ROL[usuario?.rol] ?? [];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
          <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold text-slate-800">Clínica Médica</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Usuario + logout */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        {/* Avatar + info */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            <Iniciales nombre={usuario?.nombre} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{usuario?.nombre}</p>
            <p className="text-xs text-slate-400">{ROL_LABEL[usuario?.rol] ?? usuario?.rol}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
