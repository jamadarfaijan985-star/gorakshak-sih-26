/**
 * AuthContext — handles authentication state for the entire app.
 * Separate from AppContext to keep concerns clean.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';
import { tokenStore, ApiError } from '../services/api';
import { env } from '../config/env';
import type { UserResponse } from '../types/api';

interface AuthState {
  user: UserResponse | null;
  /** true while we're still verifying the stored token on first load */
  initialising: boolean;
  isAuthenticated: boolean;
  activeFarmId: string | null;
  setUser: (u: UserResponse | null) => void;
  setActiveFarmId: (id: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const ACTIVE_FARM_KEY = 'innovx_active_farm_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserResponse | null>(null);
  const [initialising, setInitialising] = useState(true);
  const [activeFarmId, setActiveFarmIdState] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_FARM_KEY),
  );

  // On mount: if we have a stored token, validate it with /api/v1/auth/me
  useEffect(() => {
    if (env.DEMO_MODE) {
      setInitialising(false);
      return;
    }
    if (!tokenStore.get()) {
      setInitialising(false);
      return;
    }
    authService
      .getCurrentUser()
      .then((u) => {
        setUserState(u);
        // If user has a farm and no active farm is set yet, default to it
        if (u.farm_id && !localStorage.getItem(ACTIVE_FARM_KEY)) {
          setActiveFarmIdState(u.farm_id);
          localStorage.setItem(ACTIVE_FARM_KEY, u.farm_id);
        }
      })
      .catch((err) => {
        // Token invalid/expired — clear it silently
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear();
        }
      })
      .finally(() => setInitialising(false));
  }, []);

  const setUser = useCallback((u: UserResponse | null) => {
    setUserState(u);
    if (u?.farm_id && !localStorage.getItem(ACTIVE_FARM_KEY)) {
      setActiveFarmIdState(u.farm_id);
      localStorage.setItem(ACTIVE_FARM_KEY, u.farm_id);
    }
  }, []);

  const setActiveFarmId = useCallback((id: string | null) => {
    setActiveFarmIdState(id);
    if (id) localStorage.setItem(ACTIVE_FARM_KEY, id);
    else localStorage.removeItem(ACTIVE_FARM_KEY);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUserState(null);
    setActiveFarmIdState(null);
    localStorage.removeItem(ACTIVE_FARM_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        initialising,
        isAuthenticated: !!user || env.DEMO_MODE,
        activeFarmId,
        setUser,
        setActiveFarmId,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
