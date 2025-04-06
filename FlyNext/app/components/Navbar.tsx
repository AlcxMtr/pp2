'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FiSun, FiMoon } from 'react-icons/fi';
import Notification from './Notification';

interface NavbarProps {
  onToggleTheme: () => void;
  theme: string;
}

export default function Navbar({ onToggleTheme, theme }: NavbarProps) {
  const { accessToken, logout, userId } = useAuth();
  const router = useRouter();
  const [userInitials, setUserInitials] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accessToken && userId) {
      const fetchUserProfile = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/users/edit-profile', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: Number(userId) }),
          });
          if (!response.ok) throw new Error('Failed to fetch user profile');
          const data = await response.json();
          setProfilePicture(data.profilePicture || '');
          const initials = `${data.firstName?.[0] || ''}${data.lastName?.[0] || ''}`.toUpperCase();
          setUserInitials(initials || 'U'); // Fallback to 'U' only if no initials
        } catch (err) {
          console.error(err);
          setUserInitials('U'); // Fallback on error
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserProfile();
    }
  }, [accessToken, userId]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand">FlyNext</Link>
        <div className="navbar-links flex items-center space-x-4">
          <Link href="/search" className="navbar-link">Search</Link>
          {accessToken && (
            <Link href="/itineraries" className="navbar-link">Itineraries</Link>
          )}
          {accessToken && (
            <Link href="/checkout" className="navbar-link">Checkout</Link>
          )}
          {accessToken && (
            <Link href="/hotels/register" className="navbar-link">Register Hotel</Link>
          )}
          {accessToken && (
            <Link href="/hotels/my-hotels" className="navbar-link">My Hotels</Link>
          )}
          {accessToken ? (
            <button onClick={handleLogout} className="navbar-auth">Log Out</button>
          ) : (
            <Link href="/login" className="navbar-auth">Sign In</Link>
          )}
          <button onClick={onToggleTheme} className="navbar-link flex items-center">
            {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
          </button>
          {accessToken && <Notification />}
          {accessToken && (
            <Link href="/profile/edit" className="flex items-center">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile Picture"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
                  {userInitials || 'U'}
                </div>
              )}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}