'use client'; // Add this since we're using client-side state

import { ReactNode, useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check stored theme or system preference on mount
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: light)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <html lang="en" data-theme={theme}>
      <body className="min-h-screen">
        <Providers>
          <AuthProvider>
            <Navbar onToggleTheme={toggleTheme} theme={theme} />
            <main>{children}</main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}