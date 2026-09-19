import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
      {/* Animated Brand Pulse Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-[#315B36] animate-spin" />
        <div className="absolute h-8 w-8 rounded-full bg-[#EFF4EC] flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-[#315B36] animate-ping" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-[#315B36]">
          LinguaChris Academy
        </p>
        <p className="text-xs text-slate-500 font-medium">
          Loading learning materials...
        </p>
      </div>
    </div>
  );
}
