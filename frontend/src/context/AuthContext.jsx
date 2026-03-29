import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import queryClient from '../services/queryClient';
import ModalSesionExpirando from '../components/ModalSesionExpirando';

// Cuántos segundos antes de que expire se muestra el aviso
const AVISO_SEGUNDOS = 120; // 2 minutos

const AuthContext = createContext(null);

// Decodifica el payload del JWT sin verificar firma (solo para leer exp en el cliente)
function jwtExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ?? null; // segundos epoch, o null si no tiene exp
  } catch {
    return null;
  }
}

function tokenEsValido(token) {
  if (!token) return false;
  const exp = jwtExp(token);
  if (exp === null) return true; // token sin exp (app móvil) → válido
  return Date.now() / 1000 < exp;
}

function leerUsuarioStorage() {
  try {
    const token = localStorage.getItem('token');
    if (!tokenEsValido(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      return null;
    }
    const raw = localStorage.getItem('usuario');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario]             = useState(leerUsuarioStorage);
  const [mostrarAviso, setMostrarAviso]   = useState(false);
  const timerAvisoRef                     = useRef(null);
  const timerLogoutRef                    = useRef(null);

  // Cancela ambos timers
  const cancelarTimers = useCallback(() => {
    clearTimeout(timerAvisoRef.current);
    clearTimeout(timerLogoutRef.current);
  }, []);

  // Función interna de limpieza
  const limpiarSesion = useCallback(() => {
    cancelarTimers();
    setMostrarAviso(false);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    queryClient.clear();
    setUsuario(null);
  }, [cancelarTimers]);

  // Programa el aviso y el logout automático a partir del token actual
  const programarTimers = useCallback((token) => {
    cancelarTimers();
    const exp = jwtExp(token);
    if (!exp) return; // token sin expiración (no aplica)

    const ahoraMs      = Date.now();
    const expMs        = exp * 1000;
    const msParaAviso  = expMs - ahoraMs - AVISO_SEGUNDOS * 1000;
    const msParaLogout = expMs - ahoraMs;

    if (msParaAviso > 0) {
      timerAvisoRef.current = setTimeout(() => setMostrarAviso(true), msParaAviso);
    } else {
      // Queda menos de AVISO_SEGUNDOS, mostrar aviso de inmediato
      setMostrarAviso(true);
    }

    timerLogoutRef.current = setTimeout(() => limpiarSesion(), msParaLogout);
  }, [cancelarTimers, limpiarSesion]);

  // Escucha el evento que lanza el interceptor de Axios cuando recibe 401
  useEffect(() => {
    window.addEventListener('auth:expired', limpiarSesion);
    return () => window.removeEventListener('auth:expired', limpiarSesion);
  }, [limpiarSesion]);

  // Al montar con sesión ya activa, programa los timers
  useEffect(() => {
    if (!usuario) return;
    const token = localStorage.getItem('token');
    if (token) programarTimers(token);
    return cancelarTimers;
  }, [usuario?.id]); // solo cuando cambia el usuario, no en cada render

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    const perfil = { id: data.id, rol: data.rol, nombre: data.nombre };
    localStorage.setItem('usuario', JSON.stringify(perfil));
    setUsuario(perfil);
    programarTimers(data.token);
    return perfil;
  }, [programarTimers]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignorar si falla */ }
    limpiarSesion();
  }, [limpiarSesion]);

  const renovarSesion = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      localStorage.setItem('token', data.token);
      setMostrarAviso(false);
      programarTimers(data.token);
    } catch {
      limpiarSesion();
    }
  }, [programarTimers, limpiarSesion]);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
      {mostrarAviso && (
        <ModalSesionExpirando
          segundosRestantes={AVISO_SEGUNDOS}
          onRenovar={renovarSesion}
          onCerrarSesion={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
