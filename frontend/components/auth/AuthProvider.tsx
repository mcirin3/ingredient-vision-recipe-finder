'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthResponse, User } from '@/types/auth';

const STORAGE_KEY = 'iv_token';

type AuthContextType = {
  user: User | null;
  token: string | null;
  setAuth: (payload: AuthResponse) => void;
  clearAuth: () => void;
  hydrated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed: AuthResponse = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.access_token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  const setAuth = useCallback((payload: AuthResponse) => {
    setUser(payload.user);
    setToken(payload.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, setAuth, clearAuth, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
