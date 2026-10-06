'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: [data.message || 'An error occurred'] });
        }
        return;
      }

      localStorage.setItem('sanctum_token', data.token);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('username', data.user.username);
      
      router.push('/chat');
      
    } catch (err: any) {
      setErrors({ general: [err.message || 'Network error'] });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-12 flex items-center justify-center gap-4">
        <Image src="/icon.png" alt="Ripple Icon" width={48} height={48} priority className="rounded-xl" />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text">Ripple</h1>
      </div>

      <div className="bg-surface border border-border p-10 sm:p-12 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-8 text-center">Create Account</h2>
        
        {errors.general && (
          <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 mb-6 text-sm">
            {errors.general[0]}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-muted">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full border-b-2 py-2 px-1 bg-transparent focus:outline-none transition-colors text-text ${errors.username ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
              required 
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-text-muted">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border-b-2 py-2 px-1 bg-transparent focus:outline-none transition-colors text-text ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
              required 
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-text-muted">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border-b-2 py-2 px-1 bg-transparent focus:outline-none transition-colors text-text ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
              required 
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg mt-4 transition-opacity"
          >
            Register
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">
            Already have an account? <span className="text-primary font-bold">Log in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
