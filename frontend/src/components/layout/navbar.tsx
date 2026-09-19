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
    let isTicking = false;
    const handleScroll = () => {
      if (!isTicking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsScrolled((prev) => {
            // Activate floating pill at 50px, deactivate only when scrolling back above 15px
            if (!prev && scrollY > 50) return true;
            if (prev && scrollY < 15) return false;
            return prev;
          });
          isTicking = false;
        });
        isTicking = true;
      }
    };

    // Initialize on mount
    handleScroll();

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
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'py-2 sm:py-3 px-3 sm:px-6 lg:px-8 bg-transparent'
          : 'py-2.5 sm:py-3.5 px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm'
      }`}
    >
      <div
        className={`mx-auto transition-all duration-300 flex items-center justify-between ${
          isScrolled
            ? 'max-w-5xl sm:max-w-6xl rounded-2xl bg-white/95 text-slate-800 px-4 sm:px-6 py-2 shadow-xl shadow-slate-900/10 border border-slate-200/90 backdrop-blur-xl'
            : 'max-w-7xl w-full px-0'
        }`}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group shrink-0">
          {/* Mobile version: Small emblem icon only */}
          <div className="flex sm:hidden items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200/60 p-1.5 h-10 w-10 overflow-hidden transition-transform group-hover:scale-105">
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
            className={`hidden sm:block w-auto object-contain transition-all duration-300 group-hover:scale-[1.02] ${
              isScrolled ? 'h-11 sm:h-12 md:h-13' : 'h-13 sm:h-14 md:h-15'
            }`}
          />
        </Link>

        {/* Center: Navigation Links with Medium Weight and Sleek Rounded Corners */}
        <nav className="hidden lg:flex items-center gap-1.5 sm:gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`rounded-xl px-4 py-2.5 text-[15.5px] font-medium tracking-normal transition-all ${
                  isActive
                    ? 'bg-[#315b36] text-white shadow-sm font-semibold'
                    : 'text-[#2e3339] hover:text-[#315b36] hover:bg-[#eff4ec]'
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
                className="flex items-center gap-2.5 rounded-xl border border-[#e2ebe2] bg-[#eff4ec]/50 p-1.5 sm:px-4 sm:py-2.5 shadow-sm hover:bg-[#eff4ec] transition"
              >
                <Avatar
                  src={user.avatarUrl}
                  fallback={`${user.firstName[0]}${user.lastName[0]}`}
                  size="sm"
                  className="h-8 w-8 text-xs font-semibold rounded-lg bg-[#315b36] text-white"
                />
                <span className="hidden sm:inline text-[15px] font-semibold text-[#2e3339] truncate max-w-[120px]">
                  {user.firstName}
                </span>
                <ChevronDown className="h-4 w-4 text-[#5a5e63]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#e2ebe2] bg-white p-2.5 shadow-2xl animate-fade-in z-50 text-[#2e3339]">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-medium text-[#5a5e63]">Signed in as</p>
                    <p className="text-sm font-semibold text-[#2e3339] truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href={getDashboardRoute()}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#2e3339] hover:bg-[#eff4ec]"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#315b36]" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-medium text-rose-600 hover:bg-rose-50"
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
                <button className="rounded-xl text-[#2e3339] hover:text-[#315b36] hover:bg-[#eff4ec] px-4 py-2.5 sm:px-5 sm:py-2.5 text-[15px] font-semibold transition">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="rounded-xl bg-[#315b36] text-white hover:bg-[#254629] px-5 sm:px-6 py-2.5 sm:py-2.5 text-[15px] font-bold shadow-md transition hover:scale-105 active:scale-95">
                  Get Started
                </button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff4ec] text-[#2e3339] hover:bg-[#e2ebe2] transition ml-0.5"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 mx-auto max-w-5xl rounded-2xl border border-[#e2ebe2] bg-white/95 backdrop-blur-xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-2">
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
                      ? 'bg-[#315b36] text-white font-semibold'
                      : 'text-[#2e3339] hover:bg-[#eff4ec]'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 border-t border-[#e2ebe2] pt-4">
            {isAuthenticated && user ? (
              <div className="space-y-2.5">
                <Link
                  href={getDashboardRoute()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl bg-[#eff4ec] px-5 py-3 text-sm font-medium text-[#2e3339] hover:bg-[#e2ebe2]"
                >
                  <LayoutDashboard className="h-4 w-4 text-[#315b36]" />
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
                  <button className="w-full rounded-xl border border-[#e2ebe2] py-3 text-sm font-semibold text-[#2e3339] hover:bg-[#eff4ec]">
                    Sign In
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full rounded-xl bg-[#315b36] py-3 text-sm font-bold text-white hover:bg-[#254629]">
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
