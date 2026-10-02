'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Home,
  Users,
  BookOpen,
  Sparkles,
  Award,
  ArrowRight,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout, getDashboardRoute } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Handle body scroll lock when mobile aside drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle ESC key to close aside drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'About Us', href: '/about', icon: Users },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Diagnostic Quiz', href: '/quiz', icon: Sparkles },
    { name: 'Levels (CEFR)', href: '/levels', icon: Award },
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
          {/* Desktop version: Full real logo */}
          <img
            src="/real-logo.png"
            alt="LinguaChris Academy"
            className={`hidden sm:block w-auto object-contain transition-all duration-300 group-hover:scale-[1.02] ${
              isScrolled ? 'h-11 sm:h-12 md:h-13' : 'h-13 sm:h-14 md:h-15'
            }`}
          />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 sm:gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`rounded-xl px-4 py-2.5 text-[15.5px] font-medium tracking-normal transition-all ${
                  isActive
                    ? 'bg-[#012970] text-white shadow-sm font-semibold'
                    : 'text-[#172033] hover:text-[#006EF3] hover:bg-[#F3F7FC]'
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
                className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F3F7FC] p-1.5 sm:px-4 sm:py-2.5 shadow-sm hover:bg-[#eaf1fa] transition"
              >
                <Avatar
                  src={user.avatarUrl}
                  fallback={`${user.firstName[0]}${user.lastName[0]}`}
                  size="sm"
                  className="h-8 w-8 text-xs font-semibold rounded-lg bg-[#012970] text-white"
                />
                <span className="hidden sm:inline text-[15px] font-semibold text-[#172033] truncate max-w-[120px]">
                  {user.firstName}
                </span>
                <ChevronDown className="h-4 w-4 text-[#667085]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E2E8F0] bg-white p-2.5 shadow-2xl animate-fade-in z-50 text-[#172033]">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-medium text-[#667085]">Signed in as</p>
                    <p className="text-sm font-semibold text-[#172033] truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href={getDashboardRoute()}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#172033] hover:bg-[#F3F7FC]"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#006EF3]" />
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
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link href="/login" className="hidden sm:inline-block">
                <button className="rounded-xl text-[#172033] hover:text-[#006EF3] hover:bg-[#F3F7FC] px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-[15px] font-semibold transition">
                  Sign In
                </button>
              </Link>
              <Link href="/apply">
                <button className="rounded-xl bg-[#006EF3] text-white hover:bg-[#005ed1] px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-[15px] font-bold shadow-md transition hover:scale-105 active:scale-95 whitespace-nowrap">
                  Get Started
                </button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#172033] hover:bg-[#eaf1fa] transition ml-0.5 border border-slate-200/80"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5 text-[#012970]" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SLIDE-OVER ASIDE DRAWER (PORTALED TO DOCUMENT.BODY TO PREVENT CLIPPING)
      ========================================================================= */}
      {mounted && mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[99999] lg:hidden">
          {/* Full-screen Dark Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Aside Panel */}
          <aside
            className="fixed inset-y-0 right-0 z-[100000] w-[280px] sm:w-[320px] max-w-[85vw] h-full h-[100dvh] bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 transition-transform duration-300 ease-out animate-in slide-in-from-right"
            aria-label="Mobile Navigation"
          >
            {/* Aside Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="h-9 w-9 rounded-xl bg-[#F3F7FC] p-1 border border-slate-200 flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <span className="font-black text-sm text-[#012970] block leading-tight">
                    LinguaChris
                  </span>
                  <span className="text-[10px] text-[#667085] font-semibold block leading-tight">
                    Academy
                  </span>
                </div>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#667085] hover:text-[#172033] hover:bg-[#eaf1fa] transition"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Aside Nav Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                Menu
              </div>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-[#012970] text-white font-semibold shadow-sm'
                        : 'text-[#172033] hover:bg-[#F3F7FC]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#F5B400]' : 'text-[#006EF3]'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive ? (
                      <span className="h-2 w-2 rounded-full bg-[#F5B400]" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Aside Footer / Actions */}
            <div className="p-4 border-t border-slate-100 bg-[#F8FAFC] space-y-3 shrink-0">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-white rounded-xl border border-slate-200/80 flex items-center gap-3">
                    <Avatar
                      src={user.avatarUrl}
                      fallback={`${user.firstName[0]}${user.lastName[0]}`}
                      size="sm"
                      className="h-8 w-8 text-xs font-semibold rounded-lg bg-[#012970] text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#172033] truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[10px] text-[#667085] truncate">{user.email}</p>
                    </div>
                  </div>

                  <Link
                    href={getDashboardRoute()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#012970] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006EF3] transition"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Go to Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full rounded-xl bg-white border border-slate-200 py-2.5 text-xs font-semibold text-[#172033] hover:bg-slate-50 transition shadow-2xs">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/apply" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full rounded-xl bg-[#006EF3] py-2.5 text-xs font-bold text-white hover:bg-[#005ed1] transition shadow-md">
                      Get Started Free
                    </button>
                  </Link>
                </div>
              )}

              <p className="text-[10px] text-center text-[#667085]">
                LinguaChris Academy &copy; {new Date().getFullYear()}
              </p>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </header>
  );
}
