'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { AlertCircle, Sparkles } from 'lucide-react';

export function LoginForm() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in encountered an issue. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    
    // Auto submit logic
    setError(null);
    setIsLoading(true);
    try {
      await login(demoEmail, 'Password123!');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-8 tracking-tight">
        Sign in to your account
      </h2>

      {/* Continue with Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="w-full mb-6 flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {isGoogleLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          or sign in with email
        </span>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="relative">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1" htmlFor="email">
            E-mail Address
          </label>
          <div className="relative flex items-center">
            <input 
              className="w-full bg-transparent border-0 border-b-2 border-[#E2EBE2] dark:border-slate-700 focus:border-[#315B36] focus:ring-0 px-0 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-light transition-colors duration-150 outline-none" 
              id="email" 
              placeholder="Enter your mail" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="password">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#315B36] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <input 
              className="w-full bg-transparent border-0 border-b-2 border-[#E2EBE2] dark:border-slate-700 focus:border-[#315B36] focus:ring-0 px-0 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-light transition-colors duration-150 outline-none" 
              id="password" 
              placeholder="Enter your password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex items-center pt-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              className="w-4 h-4 rounded text-[#315B36] focus:ring-[#315B36] border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition" 
              type="checkbox"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-normal select-none">
              Remember me
            </span>
          </label>
        </div>

        <div className="flex items-center justify-start gap-4 pt-4">
          <button 
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="px-8 py-2.5 rounded-full bg-[#315B36] text-white font-medium text-sm shadow-[0_6px_20px_rgba(49,91,54,0.35)] hover:bg-[#254629] active:scale-95 transition-all duration-200 disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Sign In
          </button>
          
          <Link 
            href="/apply"
            className="px-8 py-2.5 rounded-full border border-[#315B36] text-[#315B36] dark:text-[#7BA27A] font-medium text-sm hover:bg-[#315B36]/10 active:scale-95 transition-all duration-200 text-center"
          >
            Apply Now
          </Link>
        </div>
      </form>

      {/* Demo account fast picker */}
      <div className="mt-8 rounded-2xl border border-dashed border-[#E2EBE2] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#315B36] dark:text-[#7BA27A]">
          <Sparkles className="h-3.5 w-3.5 text-[#315B36] dark:text-[#7BA27A]" /> Quick Demo Accounts:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('student@platform.com')}
            className="rounded-xl border border-[#E2EBE2] dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:border-[#315B36] hover:text-[#315B36] active:scale-95 transition-all text-center"
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('teacher@platform.com')}
            className="rounded-xl border border-[#E2EBE2] dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:border-[#315B36] hover:text-[#315B36] active:scale-95 transition-all text-center"
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@platform.com')}
            className="rounded-xl border border-[#E2EBE2] dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:border-[#315B36] hover:text-[#315B36] active:scale-95 transition-all text-center"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}
