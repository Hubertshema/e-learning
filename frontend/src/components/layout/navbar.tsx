'use client';

import React, { useState, useEffect } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Courses', href: '/courses' },
    { name: 'Diagnostic Quiz', href: '/quiz' },
    { name: 'Levels (CEFR)', href: '/levels' },
  ];

  return (
    <header
      className={`sticky z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'top-2 sm:top-4 px-3 sm:px-6 lg:px-8'
          : 'top-0 border-b border-slate-100 bg-white/90 backdrop-blur-md px-4 sm:px-6 lg:px-8'
      }`}
    >
      <div
        className={`mx-auto transition-all duration-300 flex items-center justify-between ${
          isScrolled
            ? 'max-w-5xl sm:max-w-6xl rounded-2xl bg-white/95 text-slate-800 px-4 sm:px-6 py-2.5 shadow-xl shadow-slate-900/5 border border-slate-200/90 backdrop-blur-xl'
            : 'max-w-7xl h-20 sm:h-24'
        }`}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group shrink-0">
          {/* Mobile version: Small emblem icon only */}
          <div className="flex sm:hidden items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200/60 p-1.5 h-11 w-11 overflow-hidden transition-transform group-hover:scale-105">
            <img
              src="/logo.png"
              alt="LinguaChris Academy"
              className="h-full w-full object-contain"
            />
          </div>
          {/* Desktop version: Full real logo (which already includes the text) */}
          <img
            src="/real-logo.png"
            alt="LinguaChris Academy"
            className={`hidden sm:block w-auto object-contain transition-all group-hover:scale-[1.02] ${
              isScrolled ? 'h-11 sm:h-13 md:h-14' : 'h-13 sm:h-15 md:h-16'
            }`}
          />
        </Link>

        {/* Center: Navigation Links with Medium Weight and Sleek Rounded Corners */}
        <nav className="hidden lg:flex items-center gap-1 sm:gap-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`rounded-xl px-4 py-2 text-sm sm:text-[15px] font-medium tracking-normal transition-all ${
                  isActive
                    ? 'bg-[#0f3d6a] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0f3d6a] hover:bg-slate-100'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Integrated Action Button / Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 sm:px-4 sm:py-2 shadow-sm hover:bg-slate-100 transition"
              >
                <Avatar
                  src={user.avatarUrl}
                  fallback={`${user.firstName[0]}${user.lastName[0]}`}
                  size="sm"
                  className="h-7 w-7 text-xs font-semibold rounded-lg"
                />
                <span className="hidden sm:inline text-sm font-semibold text-slate-900 truncate max-w-[120px]">
                  {user.firstName}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl animate-fade-in z-50 text-slate-900">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-medium text-slate-500">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href={getDashboardRoute()}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <LayoutDashboard className="h-4 w-4 text-sky-600" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login">
                <button className="rounded-xl text-slate-700 hover:text-[#0f3d6a] hover:bg-slate-100 px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold transition">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="rounded-xl bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-bold shadow-md transition hover:scale-105 active:scale-95">
                  Get Started
                </button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition ml-0.5"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-xl px-5 py-3 text-base font-medium transition ${
                    isActive
                      ? 'bg-[#0f3d6a] text-white font-semibold'
                      : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            {isAuthenticated && user ? (
              <div className="space-y-2.5">
                <Link
                  href={getDashboardRoute()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl bg-slate-100 px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-200"
                >
                  <LayoutDashboard className="h-4 w-4 text-sky-600" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 pt-1">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                    Sign In
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full rounded-xl bg-[#0f3d6a] py-3 text-sm font-bold text-white hover:bg-[#0b2b4f]">
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
