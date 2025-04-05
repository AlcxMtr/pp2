'use client';
import { user } from '@heroui/react';
import { clear } from 'console';
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

  const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds (for min for testing purposes TODO)

  useEffect(() => {
    console.log('AuthProvider mounted');
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
    console.log('REFRESHING ACCESS TOKEN');
    try {
      const response = await fetch('/api/users/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('lastRefreshTime', Date.now().toString());
      } else {
        logout();
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      logout();
    }
  };

  // Set up periodic token refresh
  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;
    const lastRefreshTime = localStorage.getItem('lastRefreshTime');
    let timeSinceLastRefresh: number;
    if (!lastRefreshTime) {
      timeSinceLastRefresh = REFRESH_INTERVAL;
    } else {
      const lastRefresh = parseInt(localStorage.getItem('lastRefreshTime') || '0', 10);
      const now = Date.now();
      timeSinceLastRefresh = now - lastRefresh;
    }
    const initialDelay = timeSinceLastRefresh >= REFRESH_INTERVAL 
      ? 0 // Refresh immediately if overdue
      : REFRESH_INTERVAL - timeSinceLastRefresh;

    console.log("initialDelay: " + initialDelay);

    // Initial refresh with calculated delay
    const timeout = setTimeout(() => {
      refreshAccessToken(refreshToken);

      // Then set up regular interval
      const interval = setInterval(() => {
        refreshAccessToken(refreshToken);
      }, REFRESH_INTERVAL);


      // Cleanup both timeout and interval
      return () => {
        clearInterval(interval);
      };
    }, initialDelay);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    console.log("userId changed: " + userId);
  }, [userId]);

  useEffect(() => {
    console.log("accessToken changed: " + accessToken);
  }, [accessToken]);

  useEffect(() => {
    console.log("refreshToken changed: " + refreshToken);
  }, [refreshToken]);

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