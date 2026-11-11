import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { authApi } from '../services/api';
import type { Usuario } from '../types';

interface AuthContextValue {
  user: Usuario | null;
  setUser: (user: Usuario | null) => void;
  loading: boolean;
  login: (data: { email: string; password: string }) => Promise<Usuario>;
  register: (data: { nombre: string; apellido: string; email: string; telefono: string | null; password: string }) => Promise<Usuario>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Acceso centralizado al usuario autenticado y a las acciones de sesión.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}

/**
 * Mantiene en contexto la sesión actual y sincroniza los datos con /auth/me.
 *
 * @param children árbol de componentes que heredan el estado de autenticación.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me().then((r) => setUser(r.usuario)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (data: { email: string; password: string }) => { const r = await authApi.login(data); setUser(r.usuario); return r.usuario; }, []);
  const register = useCallback(async (data: { nombre: string; apellido: string; email: string; telefono: string | null; password: string }) => { const r = await authApi.register(data); setUser(r.usuario); return r.usuario; }, []);
  const logout = useCallback(async () => { try { await authApi.logout(); } finally { setUser(null); } }, []);

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
