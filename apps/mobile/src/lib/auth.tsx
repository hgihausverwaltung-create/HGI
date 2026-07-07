import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createApiClient, type ApiClient } from "@hgi/api-client";
import { clearToken, getToken, setToken as persistToken } from "./tokenStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/trpc";
export const API_BASE_URL = API_URL.replace(/\/trpc\/?$/, "");

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "FIELD_STAFF";
}

interface AuthContextValue {
  user: CurrentUser | null;
  apiClient: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiClient = useMemo(() => createApiClient({ url: API_URL, getToken: () => token }), [token]);

  useEffect(() => {
    let cancelled = false;
    getToken().then((stored) => {
      if (!cancelled) setToken(stored);
      if (!stored && !cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiClient.auth.me
      .query()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (cancelled) return;
        void clearToken();
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const client = createApiClient({ url: API_URL, getToken: () => null });
    const result = await client.auth.login.mutate({ email, password });
    await persistToken(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    void clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, apiClient, login, logout, isLoading, token }), [user, apiClient, login, logout, isLoading, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden");
  return ctx;
}
