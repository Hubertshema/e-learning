'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Avatar } from '@/components/ui/avatar';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout, getDashboardRoute } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Courses', href: '/courses' },
    { name: 'Diagnostic Quiz', href: '/quiz' },
    { name: 'Levels (CEFR)', href: '/levels' },
  ];

  return (
    <header className="sticky top-3 sm:top-4 z-50 w-full px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-full bg-[#1b232a] text-white px-2 sm:px-3 py-1.5 shadow-2xl border border-white/10 backdrop-blur-xl flex items-center justify-between transition-all">
        
        {/* Left: Circular Brand Badge (Matching reference design icon pill) */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform group-hover:scale-105 p-1 shrink-0 overflow-hidden">
            <img
              src="/logo.png"
              alt="LinguaChris Academy"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="hidden xl:inline text-xs font-bold text-white tracking-tight pr-1">
            Lingua<span className="text-sky-400">Chris</span>
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white/20 text-white font-bold shadow-inner'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Integrated Action Pill (Matching reference design right capsule button) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-white text-slate-900 px-3 py-1 sm:py-1.5 shadow-md hover:bg-slate-100 transition"
              >
                <Avatar
                  src={user.avatarUrl}
                  fallback={`${user.firstName[0]}${user.lastName[0]}`}
                  size="sm"
                  className="h-6 w-6 text-[10px]"
                />
                <span className="text-xs font-bold text-slate-900 truncate max-w-[90px] sm:max-w-none">
                  {user.firstName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-fade-in z-50 text-slate-900 dark:text-white">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-medium text-slate-500">Signed in as</p>
                    <p className="text-xs font-bold text-slate-900 truncate dark:text-white">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href={getDashboardRoute()}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <LayoutDashboard className="h-4 w-4 text-sky-600" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/login">
                <button className="rounded-full text-white/90 hover:text-white hover:bg-white/10 px-3 sm:px-4 py-1.5 text-xs font-semibold transition">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="rounded-full bg-white text-[#1b232a] hover:bg-sky-50 px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-bold shadow-md transition hover:scale-105 active:scale-95">
                  Get Started
                </button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition ml-0.5"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#1b232a]/95 backdrop-blur-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 border-t border-white/10 pt-3">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <Link
                  href={getDashboardRoute()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
                >
                  <LayoutDashboard className="h-4 w-4 text-sky-400" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full rounded-full border border-white/20 py-2 text-xs font-semibold text-white hover:bg-white/10">
                    Sign In
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full rounded-full bg-white py-2 text-xs font-bold text-[#1b232a] hover:bg-sky-50">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
