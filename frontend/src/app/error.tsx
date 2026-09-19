'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  RotateCcw,
  Home,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    // Log error to console / observability service
    console.error('Next.js Client Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header Bar */}
      <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="LinguaChris Academy"
              className="h-8 w-8 object-contain sm:hidden"
            />
            <img
              src="/real-logo.png"
              alt="LinguaChris Academy"
              className="h-9 w-auto object-contain hidden sm:block"
            />
          </Link>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            System Recovery Mode
          </span>
        </div>
      </header>

      {/* Main Error Body */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-xl text-center space-y-7">
          {/* Glowing Warning Icon */}
          <div className="relative mx-auto flex items-center justify-center">
            <div className="absolute h-36 w-36 rounded-full bg-rose-100 animate-ping opacity-30" />
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-600 text-white shadow-xl shadow-rose-900/10">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Error Copy */}
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-rose-100 text-rose-800 font-extrabold text-xs px-3.5 py-1 uppercase tracking-wider">
              Runtime Exception Encountered
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Something Interrupted Your Session
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              We encountered an unexpected glitch while loading this module. Your progress data remains secure.
            </p>
          </div>

          {/* Recovery Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => reset()}
              className="rounded-full bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] px-6 py-2.5 text-xs font-bold shadow-md flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>

            <Link href="/">
              <Button
                variant="outline"
                className="rounded-full border-slate-300 hover:bg-slate-100 text-slate-800 px-6 py-2.5 text-xs font-bold flex items-center gap-2"
              >
                <Home className="h-4 w-4 text-sky-600" />
                <span>Return to Homepage</span>
              </Button>
            </Link>
          </div>

          {/* Collapsible Technical Details for Troubleshooting */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-left">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex w-full items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900"
            >
              <span>Technical Diagnostic Information</span>
              {showTechnicalDetails ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-[11px] font-mono text-slate-600">
                <div className="rounded-xl bg-slate-900 text-slate-200 p-3 overflow-x-auto">
                  <p className="text-rose-400 font-bold mb-1">
                    {error.name || 'Error'}: {error.message || 'Unknown runtime error'}
                  </p>
                  {error.digest && (
                    <p className="text-slate-400">Digest: {error.digest}</p>
                  )}
                  {error.stack && (
                    <pre className="mt-2 text-[10px] text-slate-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} LinguaChris Academy. Academic Council Support Available.</p>
      </footer>
    </div>
  );
}
