'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

  // Full-screen standalone mode for preview simulators & student classroom learning studio
  if (pathname.includes('/preview') || pathname.startsWith('/student/learn')) {
    return <div className="min-h-screen w-full bg-[#f8faf8] dark:bg-slate-950 overflow-y-auto">{children}</div>;
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
              <Link
                href={user?.role ? `/${user.role.toLowerCase()}` : '/'}
                className="hidden sm:inline hover:text-[#315B36] dark:hover:text-emerald-400 font-bold transition-colors cursor-pointer"
                title="Go to Dashboard Home"
              >
                LinguaChris LMS
              </Link>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
              <Link
                href={`/${pathname.split('/')[1] || (user?.role ? user.role.toLowerCase() : 'teacher')}`}
                className="hover:text-slate-900 dark:hover:text-white capitalize transition-colors cursor-pointer"
                title={`Go to ${pathname.split('/')[1] || 'Dashboard'} Overview`}
              >
                {pathname.split('/')[1] || 'Dashboard'}
              </Link>
              {pathname.split('/')[2] && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <Link
                    href={`/${pathname.split('/')[1]}/${pathname.split('/')[2]}`}
                    className={`capitalize transition-colors cursor-pointer ${
                      !pathname.split('/')[3]
                        ? 'text-[#315B36] dark:text-emerald-400 font-bold hover:underline'
                        : 'hover:text-[#315B36] dark:hover:text-emerald-400'
                    }`}
                    title={`Go to ${pathname.split('/')[2].replace(/-/g, ' ')}`}
                  >
                    {pathname.split('/')[2].replace(/-/g, ' ')}
                  </Link>
                </>
              )}
              {pathname.split('/')[3] && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <Link
                    href={`/${pathname.split('/')[1]}/${pathname.split('/')[2]}/${pathname.split('/')[3]}`}
                    className="text-[#315B36] dark:text-emerald-400 font-bold capitalize hover:underline transition-colors cursor-pointer"
                    title={`Go to ${pathname.split('/')[3].replace(/-/g, ' ')}`}
                  >
                    {pathname.split('/')[3].replace(/-/g, ' ')}
                  </Link>
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
