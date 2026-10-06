'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      localStorage.setItem('sanctum_token', data.token);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('username', data.user.username);
      
      router.push('/chat');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-12 flex items-center justify-center gap-4">
        <Image src="/icon.png" alt="Ripple Icon" width={48} height={48} priority className="rounded-xl" />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text">Ripple</h1>
      </div>

      <div className="bg-surface border border-border p-10 sm:p-12 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-8 text-center">Welcome back</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-muted">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-b-2 border-border py-2 px-1 bg-transparent focus:outline-none focus:border-primary transition-colors text-text"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-muted">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-border py-2 px-1 bg-transparent focus:outline-none focus:border-primary transition-colors text-text"
              required 
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg mt-4 transition-opacity"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/register" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">
            Don't have an account? <span className="text-primary font-bold">Register</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
