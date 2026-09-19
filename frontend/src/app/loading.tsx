import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
      {/* Animated Brand Pulse Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-[#0f3d6a] animate-spin" />
        <div className="absolute h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-[#0f3d6a] animate-ping" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0f3d6a]">
          LinguaChris Academy
        </p>
        <p className="text-xs text-slate-500 font-medium">
          Loading learning materials...
        </p>
      </div>
    </div>
  );
}
