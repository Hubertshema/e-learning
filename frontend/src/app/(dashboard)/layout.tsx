'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/layout/sidebar';

import { NotificationCenter } from '@/components/notifications/notification-center';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading your learning workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // RBAC Route Protection Check
  if (pathname.startsWith('/superadmin') && user.role !== 'SUPERADMIN') {
    router.replace(user.role === 'TEACHER' ? '/teacher' : '/student');
    return null;
  }

  if (pathname.startsWith('/teacher') && user.role !== 'TEACHER' && user.role !== 'SUPERADMIN') {
    router.replace('/student');
    return null;
  }

  const roleLabel =
    user.role === 'SUPERADMIN'
      ? 'System Administrator'
      : user.role === 'TEACHER'
      ? 'Certified Instructor'
      : 'Enrolled Student';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        role={user.role}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="hidden sm:inline">FluentEdge LMS</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-slate-900 dark:text-white capitalize">
                {pathname.split('/')[1] || 'Dashboard'}
              </span>
              {pathname.split('/')[2] && (
                <>
                  <span>/</span>
                  <span className="text-primary-600 dark:text-primary-400 capitalize">
                    {pathname.split('/')[2].replace(/-/g, ' ')}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{roleLabel}</span>
            </div>

            {/* In-App Notifications Center Engine */}
            <NotificationCenter />

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 font-bold text-xs text-white shadow-sm">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
