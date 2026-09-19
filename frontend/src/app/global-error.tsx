'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <span className="text-2xl font-black">!</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Application Error
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              A critical error occurred while rendering the page. Please reload the application or restart your browser.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full rounded-full bg-[#0f3d6a] py-3 text-xs font-bold text-white hover:bg-[#0b2b4f] transition flex items-center justify-center gap-2 shadow-md"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
