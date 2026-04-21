import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const AUTH_TOKEN_KEY = "smart_todo_auth_token";

type AuthContextValue = {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getInitialAuthState(): boolean {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) !== null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getInitialAuthState);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      login: () => {
        window.localStorage.setItem(AUTH_TOKEN_KEY, "mock-session-token");
        setIsAuthenticated(true);
      },
      logout: () => {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated],
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

