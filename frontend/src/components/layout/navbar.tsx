'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout, getDashboardRoute } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Diagnostic Quiz', href: '/quiz' },
    { name: 'Levels (CEFR)', href: '/levels' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About Us', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
          <img
            src="/logo.png"
            alt="LinguaChris Academy Logo"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Lingua<span className="text-[#0f3d6a] dark:text-sky-400">Chris</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-sky-600 dark:text-sky-400">
              Academy
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0f3d6a] text-white shadow-sm dark:bg-sky-600'
                    : 'text-slate-600 hover:text-[#0f3d6a] hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Actions / Auth */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-full p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Avatar
                  src={user.avatarUrl}
                  fallback={`${user.firstName[0]}${user.lastName[0]}`}
                  size="sm"
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {user.firstName} {user.lastName}
                  </span>
                  <Badge variant="indigo" className="w-fit scale-90 -ml-1 text-[10px] py-0 px-1.5">
                    {user.role}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-fade-in">
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
                    <LayoutDashboard className="h-4 w-4 text-primary-600" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gradient" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar src={user.avatarUrl} fallback={`${user.firstName[0]}${user.lastName[0]}`} />
                  <div>
                    <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <Link
                  href={getDashboardRoute()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary-600"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to Dashboard</span>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="gradient" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
