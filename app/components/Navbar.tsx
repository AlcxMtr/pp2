'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const { accessToken, logout } = useAuth();
  const router = useRouter();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand">FlyNext</Link>
        <div className="navbar-links">
          <Link href="/" className="navbar-link">Search</Link>
          {accessToken && (
            <Link href="/book" className="navbar-link">Book</Link>
          )}
          {accessToken && (
            <Link href="/hotels/register" className="navbar-link">Register Hotel</Link>
          )}
          {accessToken && (
            <Link href="/hotels/my-hotels" className="navbar-link">My Hotels</Link>
          )}
          <button onClick={toggleDarkMode} className="dark-mode-toggle">
            {darkMode ? 'Light' : 'Dark'}
          </button>
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