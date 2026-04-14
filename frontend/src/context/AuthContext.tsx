import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AUTH_EVENTS } from "@/services/authService";

import { UserInterface, AuthContextInterface } from "@/interfaces/UserAuthInterfaces";

const AuthContext = createContext<AuthContextInterface | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // On mount, load from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);


  // Login callback
  const login = useCallback((token: string, user: UserInterface) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

  }, []);

  // Logout callback
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);


  // forced log out callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleForcedLogout = () => {
      logout();
    };
    window.addEventListener(AUTH_EVENTS.FORCE_LOGOUT, handleForcedLogout);
    return () => {
      window.removeEventListener(AUTH_EVENTS.FORCE_LOGOUT, handleForcedLogout);
    };
  }, [logout]);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};