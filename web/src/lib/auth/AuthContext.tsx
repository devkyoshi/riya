"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "@/lib/api/auth";
import { setAccessToken } from "@/lib/api/client";
import type { User } from "@/types/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true, isAuthenticated: false });

  const restoreSession = useCallback(async () => {
    const stored = localStorage.getItem("refreshToken");
    if (!stored) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const data = await authApi.refresh(stored);
      setAccessToken(data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setState({ user: data.user, isLoading: false, isAuthenticated: true });
    } catch {
      localStorage.removeItem("refreshToken");
      setAccessToken(null);
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const data = await authApi.register({ fullName, email, password });
    setAccessToken(data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    const stored = localStorage.getItem("refreshToken");
    if (stored) {
      try { await authApi.logout(stored); } catch { /* ignore */ }
    }
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireAuth(): AuthContextValue {
  const auth = useAuth();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = "/login";
    }
  }, [auth.isLoading, auth.isAuthenticated]);
  return auth;
}
