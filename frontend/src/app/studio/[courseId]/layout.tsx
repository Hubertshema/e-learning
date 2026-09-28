'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { UserDropdown } from '@/components/layout/user-dropdown';
import { DashboardSkeleton } from '@/components/layout/dashboard-skeleton';
import {
  Layers,
  ArrowLeft,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Eye,
  ExternalLink,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface CourseInfo {
  id: string;
  title: string;
  level: string;
  isPublished?: boolean;
}

interface StudioNavItem {
  name: string;
  href: (courseId: string) => string;
  exact?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: StudioNavItem[] = [
  {
    name: 'Curriculum',
    href: (id) => `/studio/${id}`,
    exact: true,
    icon: Layers,
  },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const courseId = params.courseId as string;
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem('linguachris_studio_sidebar_collapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  const toggleCollapsed = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('linguachris_studio_sidebar_collapsed', String(nextState));
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (!isLoading && user && user.role !== 'TEACHER' && user.role !== 'SUPERADMIN') {
      router.replace('/student');
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  useEffect(() => {
    if (!courseId) return;
    apiClient
      .get<CourseInfo>(`/teacher/courses/${courseId}`)
      .then((res: any) => setCourse(res?.data || res || null))
      .catch(() => setCourse(null));
  }, [courseId]);

  if (isLoading || !isMounted) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  const currentSection = (() => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 2) return 'Curriculum';
    return parts[2].replace(/-/g, ' ');
  })();

  const sidebarContent = (
    <div
      className={cn(
        'flex h-full flex-col justify-between border-r border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-xl transition-all duration-300 ease-in-out shadow-[0_0_20px_rgba(0,0,0,0.02)]',
        collapsed ? 'w-20 p-3' : 'w-72 p-4'
      )}
    >
      <div className="space-y-4 overflow-y-auto overflow-x-hidden">
        {/* Brand Header with Studio Badge */}
        <div className="flex items-center justify-between px-1 pt-1">
          <Link
            href="/teacher/courses"
            className={cn('flex items-center gap-3 group', collapsed ? 'justify-center w-full' : '')}
            onClick={() => setMobileSidebarOpen(false)}
            title="Course Studio - LinguaChris"
          >
            {collapsed ? (
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm p-1.5 transition-transform group-hover:scale-105">
                <img
                  src="/logo.png"
                  alt="LinguaChris Logo"
                  className="h-full w-full object-contain"
                />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-slate-800 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm p-1">
                  <img
                    src="/logo.png"
                    alt="LinguaChris Academy"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                      LinguaChris
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <Sparkles className="h-2 w-2" /> Studio
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Course Creator Suite
                  </p>
                </div>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Toggle Button */}
        {collapsed && (
          <div className="hidden md:flex justify-center pb-1">
            <button
              onClick={toggleCollapsed}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Course Info Card (Expanded) */}
        {!collapsed && course && (
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-3.5 shadow-sm dark:from-slate-900 dark:via-slate-800/60 dark:to-slate-900 dark:border-emerald-950">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                <BookOpen className="h-3 w-3" />
                {course.level || 'Standard'}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug" title={course.title}>
              {course.title}
            </h3>
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <Link
                href={`/student/courses/${courseId}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <Eye className="h-3 w-3" />
                Student View
              </Link>
              <span className="text-[10px] text-slate-400">ID: {courseId.slice(0, 6)}...</span>
            </div>
          </div>
        )}

        {/* Studio Navigation Links */}
        <div>
          {!collapsed && (
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Course Navigation
              </p>
            </div>
          )}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const href = item.href(courseId);
              const isActive = item.exact
                ? pathname === href
                : pathname.startsWith(href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={href}
                  onClick={() => setMobileSidebarOpen(false)}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl py-2.5 text-xs font-semibold transition-all duration-150',
                    collapsed ? 'justify-center px-2' : 'px-3',
                    isActive
                      ? 'bg-gradient-to-r from-[#1f4325] to-[#2c5f34] text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:bg-emerald-50/60 hover:text-[#1f4325] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-emerald-300' : 'text-slate-400 group-hover:text-[#1f4325] dark:group-hover:text-emerald-400'
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 tracking-tight">{item.name}</span>
                  )}
                  {!collapsed && isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Navigation (Exit to Courses) */}
      <div className="border-t border-slate-200/80 dark:border-slate-800 pt-3 space-y-2">
        <Link
          href="/teacher/courses"
          onClick={() => setMobileSidebarOpen(false)}
          title={collapsed ? 'Back to Courses' : undefined}
          className={cn(
            'flex items-center gap-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-all',
            collapsed ? 'justify-center px-2' : 'px-3'
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-slate-400" />
          {!collapsed && <span>Exit to Courses</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex h-screen shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop and slide-over */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 flex h-full max-w-xs flex-1 animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar Header */}
        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 md:px-7 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-hidden">
              <Link
                href="/teacher/courses"
                className="hidden sm:inline hover:text-[#1f4325] dark:hover:text-emerald-400 transition-colors"
              >
                Teacher Studio
              </Link>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-900 dark:text-white truncate max-w-[160px] sm:max-w-[240px] font-bold" title={course?.title}>
                {course?.title || 'Studio'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 px-2.5 py-0.5 text-[11px] font-bold text-[#1f4325] dark:text-emerald-400 capitalize">
                {currentSection}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Student Preview Shortcut */}
            <Link
              href={`/student/courses/${courseId}`}
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:text-emerald-700 dark:hover:text-emerald-400 shadow-xs transition-all"
              title="Preview course as enrolled student"
            >
              <Eye className="h-3.5 w-3.5 text-emerald-600" />
              <span>Preview Course</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-50" />
            </Link>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* In-App Notifications Center Engine */}
            <NotificationCenter />

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Profile, Settings & Logout User Dropdown */}
            <UserDropdown />
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

