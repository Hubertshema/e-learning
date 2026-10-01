'use client';

import React from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F3F7FC]/50 text-[#172033] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-7 sm:p-9 shadow-lg text-center space-y-5">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F7FC] text-[#006EF3] border border-[#E2E8F0]">
            <AlertCircle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full bg-[#F3F7FC] text-[#012970] border border-[#E2E8F0] text-[11px] font-bold px-3 py-0.5 uppercase tracking-wider">
              System Error
            </span>
            <h1 className="text-2xl font-black tracking-tight text-[#172033]">
              Application Error
            </h1>
            <p className="text-xs text-[#667085] leading-relaxed max-w-sm mx-auto">
              A critical error occurred while loading the application interface.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full rounded-xl bg-[#012970] hover:bg-[#006EF3] py-2.5 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
