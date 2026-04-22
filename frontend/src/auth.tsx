import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const AUTH_TOKEN_KEY = "smart_todo_auth_token";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredToken(): string | null {
  return window.sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function setStoredToken(token: string): void {
  window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearStoredToken(): void {
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T | { error?: { message?: string } };
  if (!response.ok) {
    const message = (payload as { error?: { message?: string } }).error?.message ?? "Request failed.";
    throw new Error(message);
  }
  return payload as T;
}

async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseJsonResponse<{ user: AuthUser }>(response);
  return payload.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const existingToken = getStoredToken();
    if (!existingToken) {
      setIsBootstrapping(false);
      return;
    }

    fetchCurrentUser(existingToken)
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        clearStoredToken();
      })
      .finally(() => {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const payload = await parseJsonResponse<{ token: string }>(response);
    setStoredToken(payload.token);
    const currentUser = await fetchCurrentUser(payload.token);
    setUser(currentUser);
  }, []);

  const signup = useCallback(
    async (input: { email: string; password: string; displayName: string }) => {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await parseJsonResponse<{ user: AuthUser }>(response);
      await login(input.email, input.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      login,
      signup,
      logout,
    }),
    [isBootstrapping, login, logout, signup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

