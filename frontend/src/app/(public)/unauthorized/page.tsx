'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, LogIn, ArrowLeft, ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-lg text-center space-y-7 rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl">
        {/* Lock Icon */}
        <div className="relative mx-auto flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
            <Lock className="h-10 w-10" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs px-3.5 py-1 uppercase tracking-wider">
            Authentication Required • Error 401
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sign In to Access This Module
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            This CEFR lesson curriculum, practice drill, or student dashboard requires an active LinguaChris Academy account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/login" className="w-full sm:w-auto flex-1">
            <Button className="w-full rounded-full bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] text-xs font-bold py-2.5 flex items-center justify-center gap-2 shadow-md">
              <LogIn className="h-4 w-4" />
              <span>Sign In Now</span>
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto flex-1">
            <Button variant="outline" className="w-full rounded-full border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-bold py-2.5 flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4 text-sky-600" />
              <span>Create Account</span>
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
