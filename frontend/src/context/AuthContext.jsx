import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import queryClient from '../services/queryClient';

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
      // Token expirado o ausente — limpiar storage antes de hidratar estado
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
  const [usuario, setUsuario] = useState(leerUsuarioStorage);

  // Función interna de limpieza (usada por logout y por el evento auth:expired)
  const limpiarSesion = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    queryClient.clear(); // elimina todo el caché de React Query
    setUsuario(null);
  }, []);

  // Escucha el evento que lanza el interceptor de Axios cuando recibe 401
  useEffect(() => {
    window.addEventListener('auth:expired', limpiarSesion);
    return () => window.removeEventListener('auth:expired', limpiarSesion);
  }, [limpiarSesion]);

  // Verifica expiración periódicamente (cada 60 s) mientras la pestaña está activa
  useEffect(() => {
    if (!usuario) return;
    const intervalo = setInterval(() => {
      const token = localStorage.getItem('token');
      if (!tokenEsValido(token)) limpiarSesion();
    }, 60_000);
    return () => clearInterval(intervalo);
  }, [usuario, limpiarSesion]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    const perfil = { id: data.id, rol: data.rol, nombre: data.nombre };
    localStorage.setItem('usuario', JSON.stringify(perfil));
    setUsuario(perfil);
    return perfil;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignorar si falla */ }
    limpiarSesion();
  }, [limpiarSesion]);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
