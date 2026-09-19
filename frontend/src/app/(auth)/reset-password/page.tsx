'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ArrowLeft, KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing reset token. Please request a new password reset link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must include at least one uppercase letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/auth/reset-password', {
        token,
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may be expired.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md border-slate-200/80 shadow-2xl dark:border-slate-800">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">Invalid Reset Link</CardTitle>
          <CardDescription className="text-xs">
            No reset token was detected in your link.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/forgot-password" className="w-full">
            <Button variant="gradient" className="w-full">
              Request New Reset Link
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-slate-200/80 shadow-2xl dark:border-slate-800">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Create New Password
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Enter a strong, secure password for your LinguaChris account.
        </CardDescription>
      </CardHeader>

      {success ? (
        <CardContent className="space-y-4 text-center py-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <Badge variant="success" className="text-xs px-3 py-1">
              Password Changed
            </Badge>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
              Security Credentials Updated
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Your password has been changed successfully. All previous sessions have been revoked for your security.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/login">
              <Button variant="gradient" className="w-full">
                Sign In With New Password
              </Button>
            </Link>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary-600" /> Password Requirements:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                <li className={password.length >= 8 ? 'text-emerald-600 font-semibold' : ''}>At least 8 characters</li>
                <li className={/[A-Z]/.test(password) ? 'text-emerald-600 font-semibold' : ''}>At least one uppercase letter</li>
                <li className={/[0-9]/.test(password) ? 'text-emerald-600 font-semibold' : ''}>At least one number</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" variant="gradient" className="w-full" disabled={submitting}>
              {submitting ? 'Updating Security Credentials...' : 'Save New Password'}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-primary-600 dark:text-slate-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-xs text-slate-500 text-center py-12">Loading reset page...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
