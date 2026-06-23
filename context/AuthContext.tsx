import React, { createContext, useContext, useEffect, useState } from "react";

import {
  authenticateUser,
  hasActiveSession,
  setAuthSession,
} from "@/services/localDb";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const active = await hasActiveSession();
        setIsLoggedIn(active);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const ok = await authenticateUser(username, password);
    if (ok) {
      await setAuthSession(true);
      setIsLoggedIn(true);
    }
    return ok;
  };

  const logout = async () => {
    await setAuthSession(false);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
