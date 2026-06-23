import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const AUTH_KEY = "@eg_auth_v1";
const VALID_USERNAME = "elton";
const VALID_PASSWORD = "23112004";

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
    AsyncStorage.getItem(AUTH_KEY).then((val) => {
      if (val === "true") setIsLoggedIn(true);
      setIsLoading(false);
    });
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    if (
      username.trim().toLowerCase() === VALID_USERNAME &&
      password === VALID_PASSWORD
    ) {
      await AsyncStorage.setItem(AUTH_KEY, "true");
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
