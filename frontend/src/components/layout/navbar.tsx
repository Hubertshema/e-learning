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
          ? 'top-3 sm:top-4 px-3 sm:px-6 lg:px-8'
          : 'top-0 border-b border-slate-100 bg-white/90 backdrop-blur-md px-4 sm:px-6 lg:px-8'
      }`}
    >
      <div
        className={`mx-auto transition-all duration-300 flex items-center justify-between ${
          isScrolled
            ? 'max-w-4xl sm:max-w-5xl rounded-full bg-white/95 text-slate-800 px-3 sm:px-4 py-2 shadow-xl shadow-slate-900/5 border border-slate-200/90 backdrop-blur-xl'
            : 'max-w-7xl h-16'
        }`}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group shrink-0">
          {/* Mobile version: Small emblem icon only */}
          <div className="flex sm:hidden items-center justify-center rounded-full bg-white shadow-sm border border-slate-200/60 p-1 h-9 w-9 overflow-hidden transition-transform group-hover:scale-105">
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
              isScrolled ? 'h-9 sm:h-10' : 'h-10 sm:h-11'
            }`}
          />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
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
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 sm:px-3 sm:py-1.5 shadow-sm hover:bg-slate-100 transition"
              >
                <Avatar
                  src={user.avatarUrl}
                  fallback={`${user.firstName[0]}${user.lastName[0]}`}
                  size="sm"
                  className="h-6 w-6 text-[10px]"
                />
                <span className="hidden sm:inline text-xs font-bold text-slate-900 truncate max-w-[100px]">
                  {user.firstName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-fade-in z-50 text-slate-900">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-medium text-slate-500">Signed in as</p>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href={getDashboardRoute()}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <LayoutDashboard className="h-4 w-4 text-sky-600" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login">
                <button className="rounded-full text-slate-700 hover:text-[#0f3d6a] hover:bg-slate-100 px-3.5 py-1.5 text-xs font-semibold transition">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="rounded-full bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-bold shadow-md transition hover:scale-105 active:scale-95">
                  Get Started
                </button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition ml-0.5"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
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
                      ? 'bg-[#0f3d6a] text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-3">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <Link
                  href={getDashboardRoute()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
                >
                  <LayoutDashboard className="h-4 w-4 text-sky-600" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full rounded-full border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    Sign In
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full rounded-full bg-[#0f3d6a] py-2 text-xs font-bold text-white hover:bg-[#0b2b4f]">
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
