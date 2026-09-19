'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, Lock, Mail, Sparkles, ArrowLeft } from 'lucide-react';

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

  // Quick fill helper for testing demo accounts
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <Card className="w-full max-w-md border border-[#E2EBE2] bg-white shadow-xl rounded-3xl overflow-hidden my-auto">
      {/* Mobile-only Logo Header */}
      <div className="lg:hidden text-center pt-5 pb-1">
        <Link href="/" className="inline-block">
          <img
            src="/real-logo.png"
            alt="LinguaChris Academy"
            className="h-10 w-auto object-contain mx-auto"
          />
        </Link>
      </div>

      <CardHeader className="space-y-1 text-center px-5 sm:px-6 pt-4 lg:pt-6 pb-2">
        <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2E3339]">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Sign in to access your interactive courses & studio
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 px-5 sm:px-6 py-2">
        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
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

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            or continue with email
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <Input
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              className="h-9 sm:h-10 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#315B36] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className="h-9 sm:h-10 rounded-xl text-xs"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-[#315B36] text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-[#254629] transition-colors mt-1"
            isLoading={isLoading}
          >
            Sign In to Dashboard
          </Button>
        </form>

        {/* Demo account fast picker */}
        <div className="rounded-xl border border-dashed border-[#E2EBE2] bg-[#EFF4EC]/50 p-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold text-[#315B36]">
            <Sparkles className="h-3 w-3 text-[#315B36]" /> Quick Demo Accounts:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('student@platform.com')}
              className="rounded-lg border border-[#E2EBE2] bg-white px-2 py-1 text-[10.5px] font-bold text-slate-700 shadow-xs hover:border-[#315B36] hover:text-[#315B36] active:scale-95 transition-all text-center"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('teacher@platform.com')}
              className="rounded-lg border border-[#E2EBE2] bg-white px-2 py-1 text-[10.5px] font-bold text-slate-700 shadow-xs hover:border-[#315B36] hover:text-[#315B36] active:scale-95 transition-all text-center"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@platform.com')}
              className="rounded-lg border border-[#E2EBE2] bg-white px-2 py-1 text-[10.5px] font-bold text-slate-700 shadow-xs hover:border-[#315B36] hover:text-[#315B36] active:scale-95 transition-all text-center"
            >
              Admin
            </button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-1.5 px-5 sm:px-6 pb-3 pt-0 border-t border-slate-100 bg-slate-50/40">
        <p className="text-center text-xs text-slate-600 pt-2">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-bold text-[#315B36] hover:underline">
            Create an Account
          </Link>
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#315B36] transition-colors pt-0.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
