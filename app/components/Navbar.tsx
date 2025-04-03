'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FiSun, FiMoon } from 'react-icons/fi';
import Notification from './Notification';

interface NavbarProps {
  onToggleTheme: () => void;
  theme: string;
}

export default function Navbar({ onToggleTheme, theme }: NavbarProps) {
  const { accessToken, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand">FlyNext</Link>
        <div className="navbar-links">  
          <Link href="/search" className="navbar-link">Search</Link>
          {accessToken && (
            <Link href="/itineraries" className="navbar-link">Itineraries</Link>
          )}
          {accessToken && (
            <Link href="/hotels/register" className="navbar-link">Register Hotel</Link>
          )}
          {accessToken && (
            <Link href="/hotels/my-hotels" className="navbar-link">My Hotels</Link>
          )}
          <button onClick={onToggleTheme} className="navbar-link flex items-center">
            {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
          </button>
          {accessToken && <Notification />}
          {accessToken ? (
            <button onClick={handleLogout} className="navbar-link">Logout</button>
          ) : (
            <Link href="/login" className="navbar-link">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}