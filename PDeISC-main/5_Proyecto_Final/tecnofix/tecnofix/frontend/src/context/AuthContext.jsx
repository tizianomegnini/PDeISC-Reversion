import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me().then((r) => setUser(r.usuario)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (d) => { const r = await authApi.login(d); setUser(r.usuario); return r.usuario; }, []);
  const register = useCallback(async (d) => { const r = await authApi.register(d); setUser(r.usuario); return r.usuario; }, []);
  const logout = useCallback(async () => { try { await authApi.logout(); } finally { setUser(null); } }, []);

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
