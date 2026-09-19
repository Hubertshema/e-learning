'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, Lock, Mail, Sparkles } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Quick fill helper for testing demo accounts
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <Card className="w-full max-w-md border-slate-200/80 shadow-xl dark:border-slate-800">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
        <CardDescription>Enter your email and password to access your learning portal</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary-600 hover:underline"
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
            />
          </div>

          {/* Demo account fast picker */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Demo Quick Sign-in:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student@platform.com')}
                className="rounded-lg border bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:border-primary-500 hover:text-primary-600 dark:bg-slate-800 dark:text-slate-200"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('teacher@platform.com')}
                className="rounded-lg border bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:border-primary-500 hover:text-primary-600 dark:bg-slate-800 dark:text-slate-200"
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@platform.com')}
                className="rounded-lg border bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:border-primary-500 hover:text-primary-600 dark:bg-slate-800 dark:text-slate-200"
              >
                Admin
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" variant="gradient" className="w-full" isLoading={isLoading}>
            Sign In to Dashboard
          </Button>

          <p className="text-center text-xs text-slate-600 dark:text-slate-400">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="font-semibold text-primary-600 hover:underline">
              Create an Account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
