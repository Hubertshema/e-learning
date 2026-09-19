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
      <body className="min-h-screen bg-[#eff4ec]/30 text-[#2e3339] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-[#e2ebe2] bg-white p-7 sm:p-9 shadow-lg text-center space-y-5">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36] border border-[#7ba27a]/30">
            <AlertCircle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full bg-[#eff4ec] text-[#315b36] border border-[#7ba27a]/30 text-[11px] font-bold px-3 py-0.5 uppercase tracking-wider">
              System Error
            </span>
            <h1 className="text-2xl font-black tracking-tight text-[#2e3339]">
              Application Error
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              A critical error occurred while loading the application interface.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full rounded-xl bg-[#315b36] hover:bg-[#254629] py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
