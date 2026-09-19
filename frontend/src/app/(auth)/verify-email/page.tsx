'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'VERIFYING' | 'SUCCESS' | 'EXPIRED' | 'INVALID' | 'ALREADY_VERIFIED' | 'ERROR'>('VERIFYING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('INVALID');
      setErrorMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        setStatus('VERIFYING');
        const res = await apiClient.post<any>('/auth/verify-email', { token });
        setStatus('SUCCESS');
      } catch (err: any) {
        const msg = err.message || '';
        if (msg.includes('expired')) {
          setStatus('EXPIRED');
        } else if (msg.includes('already verified') || msg.includes('used')) {
          setStatus('ALREADY_VERIFIED');
        } else {
          setStatus('INVALID');
        }
        setErrorMessage(msg || 'Failed to verify email.');
      }
    };

    verify();
  }, [token]);

  return (
    <Card className="w-full max-w-md border-slate-200/80 shadow-2xl dark:border-slate-800">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950">
          <BookOpen className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Email Verification
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Securing and activating your LinguaChris Academy account.
        </CardDescription>
      </CardHeader>

      <CardContent className="py-6 text-center">
        {status === 'VERIFYING' && (
          <div className="space-y-4">
            <RefreshCw className="mx-auto h-10 w-10 animate-spin text-primary-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Validating your security token...
            </p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <Badge variant="success" className="text-xs px-3 py-1">
                Verified Successfully
              </Badge>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                Your Email is Confirmed!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Thank you for verifying your address. Your account is fully unlocked and ready for learning.
              </p>
            </div>
          </div>
        )}

        {status === 'ALREADY_VERIFIED' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <Badge variant="indigo" className="text-xs px-3 py-1">
                Account Active
              </Badge>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                Already Verified
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Your account is already verified. You can proceed directly to your dashboard.
              </p>
            </div>
          </div>
        )}

        {(status === 'EXPIRED' || status === 'INVALID') && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <XCircle className="h-8 w-8" />
            </div>
            <div>
              <Badge variant="destructive" className="text-xs px-3 py-1">
                {status === 'EXPIRED' ? 'Token Expired' : 'Invalid Link'}
              </Badge>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                Verification Failed
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {errorMessage || 'This verification link is invalid or has expired.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-3">
        {status === 'SUCCESS' || status === 'ALREADY_VERIFIED' ? (
          <Link href="/login" className="w-full">
            <Button variant="gradient" className="w-full">
              Proceed to Sign In <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-xs text-slate-500 text-center py-12">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
