'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function RegisterForm() {
  const { register, loginWithGoogle } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLevel, setTargetLevel] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: Record<string, any> = {
        firstName,
        lastName,
        email,
        password,
        role: 'STUDENT',
        nativeLanguage: nativeLanguage || 'English',
      };

      if (targetLevel) {
        payload.targetLevel = targetLevel;
      }

      await register(payload);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle({ role: 'STUDENT' });
    } catch (err: any) {
      setError(err.message || 'Google registration encountered an issue. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg border border-[#E2EBE2] bg-white shadow-xl rounded-3xl overflow-hidden my-auto">
      {/* Mobile-only Logo Header */}
      <div className="lg:hidden text-center pt-4 pb-0">
        <Link href="/" className="inline-block">
          <img
            src="/real-logo.png"
            alt="LinguaChris Academy"
            className="h-9 w-auto object-contain mx-auto"
          />
        </Link>
      </div>

      <CardHeader className="space-y-1 text-center px-5 sm:px-6 pt-3 lg:pt-5 pb-1">
        <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2E3339]">
          Create Student Account
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Join LinguaChris Academy and start your English fluency journey
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2.5 px-5 sm:px-6 py-2">
        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          className="w-full h-10 flex items-center justify-center gap-2.5 px-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition-all disabled:opacity-50"
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
        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            or enter details
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-2 text-xs font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Row 1: Names */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[11px] font-bold text-slate-700">First Name</label>
              <Input
                placeholder="Alex"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="h-8 sm:h-9 rounded-xl text-xs px-2.5"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[11px] font-bold text-slate-700">Last Name</label>
              <Input
                placeholder="Kagabo"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="h-8 sm:h-9 rounded-xl text-xs px-2.5"
              />
            </div>
          </div>

          {/* Row 2: Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[11px] font-bold text-slate-700">Email Address</label>
              <Input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8 sm:h-9 rounded-xl text-xs px-2.5"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[11px] font-bold text-slate-700">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-8 sm:h-9 rounded-xl text-xs px-2.5"
              />
            </div>
          </div>

          {/* Row 3: Native Language & Target Level (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-100 pt-1.5">
            <div className="space-y-0.5">
              <label className="text-[11px] font-bold text-slate-700">Native Language</label>
              <Input
                placeholder="e.g. Kinyarwanda"
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="h-8 sm:h-9 rounded-xl text-xs px-2.5"
              />
            </div>
            <div className="space-y-0.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Target Level <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="flex h-8 sm:h-9 w-full rounded-xl border border-input bg-white px-2.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#315B36]"
              >
                <option value="">Not Sure / Optional</option>
                <option value="A1">A1 — Beginner</option>
                <option value="A2">A2 — Elementary</option>
                <option value="B1">B1 — Intermediate</option>
                <option value="B2">B2 — Upper Intermediate</option>
                <option value="C1">C1 — Advanced</option>
                <option value="C2">C2 — Mastery</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-9 sm:h-10 bg-[#315B36] text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-[#254629] transition-colors mt-1"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-1.5 px-5 sm:px-6 pb-3 pt-0 border-t border-slate-100 bg-slate-50/40">
        <p className="text-center text-xs text-slate-600 pt-2">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#315B36] hover:underline">
            Sign In
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
