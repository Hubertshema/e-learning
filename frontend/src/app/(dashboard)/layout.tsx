'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/layout/sidebar';

import { DashboardSkeleton } from '@/components/layout/dashboard-skeleton';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { UserDropdown } from '@/components/layout/user-dropdown';
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
    return <DashboardSkeleton />;
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

  // Preview simulator routes should be standalone without the dashboard sidebar and top navbar
  if (pathname.includes('/preview')) {
    return <div className="h-screen w-full bg-[#f8faf8] overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        role={user.role}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar Header with high z-index to overlay main content */}
        <header className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
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
              <span className="hidden sm:inline">LinguaChris LMS</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-slate-900 dark:text-white capitalize">
                {pathname.split('/')[1] || 'Dashboard'}
              </span>
              {pathname.split('/')[2] && (
                <>
                  <span>/</span>
                  <span className="text-[#315B36] capitalize">
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

            {/* Profile, Settings & Logout User Dropdown */}
            <UserDropdown />
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
