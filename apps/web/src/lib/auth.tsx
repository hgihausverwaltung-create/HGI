import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createApiClient, type ApiClient } from "@hgi/api-client";

const TOKEN_STORAGE_KEY = "hgi.token";

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
  apiBaseUrl: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/trpc").replace(/\/trpc\/?$/, "");

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiClient = useMemo(
    () =>
      createApiClient({
        url: import.meta.env.VITE_API_URL ?? "http://localhost:4000/trpc",
        getToken: () => token,
      }),
    [token],
  );

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    apiClient.auth.me
      .query()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_STORAGE_KEY);
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
    const client = createApiClient({
      url: import.meta.env.VITE_API_URL ?? "http://localhost:4000/trpc",
      getToken: () => null,
    });
    const result = await client.auth.login.mutate({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, apiClient, login, logout, isLoading, token, apiBaseUrl: API_BASE_URL }),
    [user, apiClient, login, logout, isLoading, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden");
  return ctx;
}
