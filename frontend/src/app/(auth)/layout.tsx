import React from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, ShieldCheck, Sparkles, Star } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left decorative brand side */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/60 via-slate-900 to-indigo-950/80" />
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">FluentEdge Academy</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-300">
            <Sparkles className="h-3.5 w-3.5 text-primary-400" />
            <span>Master English with Confidence</span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Empowering your career and communication through certified language mastery.
          </h1>

          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>International CEFR standard levels from Starter (Pre-A1) to C2</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Interactive lessons in Grammar, Speaking, Listening & Vocabulary</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Direct teacher feedback and verifiable digital credentials</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-slate-800 pt-6 text-xs text-slate-400">
          <span>Trusted by thousands of students and teachers</span>
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="ml-1 font-semibold text-white">4.9/5</span>
          </div>
        </div>
      </div>

      {/* Right form side */}
      <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
