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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      const parsed: AuthResponse = JSON.parse(stored);
      return parsed.user;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      const parsed: AuthResponse = JSON.parse(stored);
      return parsed.access_token;
    } catch {
      return null;
    }
  });

  const [hydrated, setHydrated] = useState(() => typeof window !== 'undefined');

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
