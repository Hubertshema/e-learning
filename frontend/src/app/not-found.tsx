'use client';

import React from 'react';
import Link from 'next/link';
import { Home, BookOpen, ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F3F7FC]/50 flex flex-col justify-between">
      {/* Top Bar with Brand */}
      <header className="w-full border-b border-[#E2E8F0] bg-white px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="LinguaChris Academy"
              className="h-9 w-9 object-contain sm:hidden"
            />
            <img
              src="/real-logo.png"
              alt="LinguaChris Academy"
              className="h-10 w-auto object-contain hidden sm:block"
            />
          </Link>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = '/';
              }
            }}
            className="text-xs font-bold text-[#172033] hover:text-[#006EF3] flex items-center gap-1.5 transition px-3 py-1.5 rounded-xl hover:bg-[#F3F7FC]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go Back</span>
          </button>
        </div>
      </header>

      {/* Main 404 Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-7 sm:p-9 shadow-lg text-center space-y-5">
          {/* Icon Badge */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F7FC] text-[#006EF3] border border-[#E2E8F0]">
            <FileQuestion className="h-7 w-7" />
          </div>

          {/* Heading & Meaning */}
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-[#F3F7FC] text-[#012970] border border-[#E2E8F0] text-[11px] font-bold px-3 py-0.5 uppercase tracking-wider">
              404 • Not Found
            </span>
            <h1 className="text-2xl font-black text-[#172033] tracking-tight">
              Page Not Found
            </h1>
            <p className="text-xs text-[#667085] leading-relaxed max-w-sm mx-auto">
              The page or resource you requested does not exist, has been moved, or the URL was mistyped.
            </p>
          </div>

          {/* User Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link href="/" className="flex-1">
              <Button className="w-full rounded-xl bg-[#012970] hover:bg-[#006EF3] text-white text-xs font-bold py-2.5 shadow-sm flex items-center justify-center gap-1.5 transition-colors">
                <Home className="h-4 w-4" />
                <span>Return Home</span>
              </Button>
            </Link>
            <Link href="/courses" className="flex-1">
              <Button
                variant="outline"
                className="w-full rounded-xl border-[#E2E8F0] hover:bg-[#F3F7FC] text-[#172033] hover:text-[#006EF3] text-xs font-bold py-2.5 flex items-center justify-center gap-1.5"
              >
                <BookOpen className="h-4 w-4 text-[#006EF3]" />
                <span>Browse Courses</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#E2E8F0] py-4 text-center text-xs text-[#667085]">
        <p>© {new Date().getFullYear()} LinguaChris Academy. Learn today, Speak tomorrow.</p>
      </footer>
    </div>
  );
}
