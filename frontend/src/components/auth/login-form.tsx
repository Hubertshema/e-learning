'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Please enter a valid, well-formatted email address (e.g. yourname@domain.com).');
      }

      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
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
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-5 tracking-tight">
        Sign in to your account
      </h2>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs font-medium text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1" htmlFor="email">
            E-mail Address
          </label>
          <div className="relative flex items-center">
            <input 
              className="w-full bg-transparent border-0 border-b-2 border-[#E2E8F0] dark:border-slate-700 focus:border-[#006EF3] focus:ring-0 px-0 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-light transition-colors duration-150 outline-none" 
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
              className="text-xs font-semibold text-[#006EF3] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <input 
              className="w-full bg-transparent border-0 border-b-2 border-[#E2E8F0] dark:border-slate-700 focus:border-[#006EF3] focus:ring-0 px-0 py-2 pr-9 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-light transition-colors duration-150 outline-none" 
              id="password" 
              placeholder="Enter your password" 
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center pt-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              className="w-4 h-4 rounded text-[#006EF3] focus:ring-[#006EF3] border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition" 
              type="checkbox"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-normal select-none">
              Remember me
            </span>
          </label>
        </div>

        <div className="flex items-center justify-start gap-3 pt-2">
          <button 
            type="submit"
            disabled={isLoading}
            className="px-7 py-2.5 rounded-full bg-[#012970] text-white font-medium text-sm shadow-[0_6px_20px_rgba(1,41,112,0.3)] hover:bg-[#001f54] active:scale-95 transition-all duration-200 disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Sign In
          </button>
          
          <Link 
            href="/apply"
            className="px-7 py-2.5 rounded-full border border-[#012970] text-[#012970] dark:text-[#006EF3] font-medium text-sm hover:bg-[#F3F7FC] active:scale-95 transition-all duration-200 text-center"
          >
            Apply Now
          </Link>
        </div>
      </form>

      {/* Demo account fast picker */}
      <div className="mt-5 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-2.5">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#006EF3]">
          <Sparkles className="h-3.5 w-3.5 text-[#006EF3]" /> Quick Demo Accounts:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('student@platform.com')}
            className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:border-[#006EF3] hover:text-[#006EF3] active:scale-95 transition-all text-center"
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('teacher@platform.com')}
            className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:border-[#006EF3] hover:text-[#006EF3] active:scale-95 transition-all text-center"
          >
            Teacher
          </button>
        </div>
      </div>
    </div>
  );
}
