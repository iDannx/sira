import { useCallback, useEffect, useState } from 'react';
import { getStoredUser, getStoredToken, logout as doLogout } from '../services/auth';
import { USER_KEY } from '../services/api';
import type { User } from '../types/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === USER_KEY || e.key === null) {
        setUser(getStoredUser());
        setToken(getStoredToken());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const logout = useCallback(async () => {
    await doLogout();
    setUser(null);
    setToken(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: Boolean(token),
    logout,
  };
}
