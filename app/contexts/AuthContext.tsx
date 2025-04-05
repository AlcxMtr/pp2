'use client';
import { user } from '@heroui/react';
import { clear, log } from 'console';
import { set } from 'lodash';
import { init } from 'next/dist/compiled/webpack/webpack';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  login: (accessToken: string, refreshToken: string, userId: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const debugAuth = false;

  const REFRESH_INTERVAL = 12 * 60 * 1000; // 12 minutes in milliseconds (refresh expires in 15 minutes)

  useEffect(() => {
    if (debugAuth) console.log('AuthProvider mounted');
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUserId = localStorage.getItem('userId');
    if (storedAccessToken && storedRefreshToken && storedUserId) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUserId(storedUserId);
      setLoading(false);
    }
  }, []);

  const refreshAccessToken = async (refreshToken: string) => {
    if (debugAuth) console.log('REFRESHING ACCESS TOKEN');
    try {
      setLoading(true);
      const response = await fetch('/api/users/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      const data = await response.json();
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('lastRefreshTime', Date.now().toString());
    } catch (error) {
      console.error('Error refreshing access token:', error);
      logout(); 
    } finally {
      setLoading(false);
    }
  };

  // Set up periodic token refresh
  useEffect(() => {
    if (!refreshToken) return;

    const calculateInitialDelay = () => {
      const lastRefreshTime = localStorage.getItem('lastRefreshTime');
      const now = Date.now();
      const lastRefresh = lastRefreshTime ? parseInt(lastRefreshTime, 10) : 0;
      const timeSinceLastRefresh = now - lastRefresh;
      return timeSinceLastRefresh >= REFRESH_INTERVAL 
        ? 0 
        : REFRESH_INTERVAL - timeSinceLastRefresh;
    };

    const initialDelay = calculateInitialDelay();
    if (debugAuth) console.log("initialDelay: " + initialDelay);

    // Initial refresh with calculated delay
    const timeout = setTimeout(() => {
      refreshAccessToken(refreshToken);

      // Then set up refresh loop
      const interval = setInterval(() => {
        refreshAccessToken(refreshToken);
      }, REFRESH_INTERVAL);

      return () => {
        clearInterval(interval);
      };
    }, initialDelay);

    return () => clearTimeout(timeout);
  }, [refreshToken]);

  if (debugAuth) {  
    useEffect(() => {
      console.log("userId changed: " + userId);
    }, [userId]);

    useEffect(() => {
      console.log("accessToken changed: " + accessToken);
    }, [accessToken]);

    useEffect(() => {
      console.log("refreshToken changed: " + refreshToken);
    }, [refreshToken]);
  }

  const login = (newAccessToken: string, newRefreshToken: string, newUserId: string) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUserId(newUserId);
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('lastRefreshTime', Date.now().toString());
    setLoading(false);
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUserId(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('lastRefreshTime');
    setLoading(true);
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, userId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}