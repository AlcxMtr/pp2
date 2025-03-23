'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  login: (accessToken: string, refreshToken: string, userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUserId = localStorage.getItem('userId');
    if (storedAccessToken && storedRefreshToken && storedUserId) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUserId(storedUserId);
    }
  }, []);

  const login = (newAccessToken: string, newRefreshToken: string, newUserId: string) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUserId(newUserId);
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('userId', newUserId);
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUserId(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}