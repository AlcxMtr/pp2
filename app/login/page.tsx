'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        const decodedToken = JSON.parse(atob(data.accessToken.split('.')[1])); // Decode JWT payload
        login(data.accessToken, data.refreshToken, decodedToken.userId);
        router.push('/');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      alert('Error logging in');
    }
    setLoading(false);
  };

  return (
    <div className="register-hotel-container">
      <h1 className="register-hotel-title">Sign In</h1>
      <form onSubmit={handleLogin} className="register-hotel-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />
        <button type="submit" disabled={loading} className="submit-button dark:text-black">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center mt-4 text-[var(--text-dark)] dark:text-white">
        Don’t have an account?{' '}
        <Link href="/register" className="text-blue-500 hover:text-black">
          Register now!
        </Link>
      </p>
    </div>
  );
}