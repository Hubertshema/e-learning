'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Home,
  BookOpen,
  Sparkles,
  ArrowLeft,
  Search,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Bar with Brand */}
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
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-600 hover:text-[#0f3d6a]">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Safety
            </Button>
          </Link>
        </div>
      </header>

      {/* Main 404 Hero Container */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-2xl text-center space-y-8">
          {/* Animated Graphic / Badge */}
          <div className="relative mx-auto flex items-center justify-center">
            {/* Background glowing rings */}
            <div className="absolute h-44 w-44 rounded-full bg-sky-100 animate-pulse opacity-70" />
            <div className="absolute h-32 w-32 rounded-full border-2 border-dashed border-sky-300 animate-spin-slow" />
            
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-[#0f3d6a] text-white shadow-xl shadow-sky-900/10">
              <Compass className="h-12 w-12 text-sky-400" />
            </div>
          </div>

          {/* Heading & Explanations */}
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-sky-100 text-sky-800 font-extrabold text-xs px-3.5 py-1 uppercase tracking-wider">
              Error 404 • Destination Not Found
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Lost in Language Translation?
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
              The syllabus, lesson drill, or page you are looking for has been relocated, archived, or never existed in this CEFR framework.
            </p>
          </div>

          {/* Direct Action Hub */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/">
              <Button className="rounded-full bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] px-6 py-2.5 text-xs font-bold shadow-md flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Return to Homepage</span>
              </Button>
            </Link>

            <Link href="/courses">
              <Button variant="outline" className="rounded-full border-slate-300 hover:bg-slate-100 text-slate-800 px-6 py-2.5 text-xs font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-sky-600" />
                <span>Explore Courses</span>
              </Button>
            </Link>

            <Link href="/quiz">
              <Button variant="outline" className="rounded-full border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 px-6 py-2.5 text-xs font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span>Take Diagnostic Quiz</span>
              </Button>
            </Link>
          </div>

          {/* Quick Helpful Links Card */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Popular Learning Destinations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <Link
                href="/levels"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-sky-300 hover:bg-sky-50/50 transition font-medium text-slate-800"
              >
                <span>CEFR Levels (Pre-A1-C2)</span>
                <span className="text-sky-600 font-bold">➔</span>
              </Link>
              <Link
                href="/about"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-sky-300 hover:bg-sky-50/50 transition font-medium text-slate-800"
              >
                <span>About LinguaChris</span>
                <span className="text-sky-600 font-bold">➔</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-sky-300 hover:bg-sky-50/50 transition font-medium text-slate-800"
              >
                <span>Student / Teacher Portal</span>
                <span className="text-sky-600 font-bold">➔</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} LinguaChris Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}
