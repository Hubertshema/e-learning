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
  ClipboardList,
  CheckCircle2,
  Settings,
  Eye,
  ArrowLeft,
  Activity,
  ShieldCheck,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  BookOpen,
} from 'lucide-react';

interface CourseInfo {
  id: string;
  title: string;
  level: string;
}

interface StudioNavItem {
  name: string;
  href: (courseId: string) => string;
  exact?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: StudioNavItem[] = [
  {
    name: 'Curriculum',
    href: (id) => `/studio/${id}`,
    exact: true,
    icon: Layers,
  },
  {
    name: 'Activities',
    href: (id) => `/studio/${id}/activities`,
    icon: Activity,
  },
  {
    name: 'Assignments',
    href: (id) => `/studio/${id}/assignments`,
    icon: ClipboardList,
  },
  {
    name: 'Quizzes',
    href: (id) => `/studio/${id}/quizzes`,
    icon: CheckCircle2,
  },
  {
    name: 'Preview',
    href: (id) => `/teacher/courses/${id}/preview`,
    icon: Eye,
  },
  {
    name: 'Settings',
    href: (id) => `/studio/${id}/settings`,
    icon: Settings,
  },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const courseId = params.courseId as string;
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
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

  const isLessonBuilder = pathname.includes('/lessons/');
  if (isLessonBuilder) {
    return <>{children}</>;
  }

  const currentSection = (() => {
    const parts = pathname.split('/').filter(Boolean);
    // e.g. /studio/[courseId]/settings -> parts = ['studio', '[id]', 'settings']
    if (parts.length <= 2) return 'Curriculum';
    return parts[2].replace(/-/g, ' ');
  })();

  const sidebarContent = (
    <div
      className={cn(
        'flex h-full flex-col justify-between border-r border-[#e2ebe2] bg-white transition-all duration-300 ease-in-out shadow-sm',
        collapsed ? 'w-20 p-3' : 'w-64 p-4'
      )}
    >
      <div className="space-y-5 overflow-y-auto overflow-x-hidden">
        {/* Brand Header with Collapse Toggle */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/teacher/courses"
            className={cn('flex items-center gap-3', collapsed ? 'justify-center w-full' : '')}
            onClick={() => setMobileSidebarOpen(false)}
            title="LinguaChris Academy - Course Studio"
          >
            {collapsed ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#e2ebe2] shadow-xs overflow-hidden p-1">
                <img
                  src="/logo.png"
                  alt="LinguaChris Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col">
                <img
                  src="/logo.png"
                  alt="LinguaChris Academy"
                  className="h-9 w-auto max-w-[155px] object-contain object-left"
                />
                <span className="text-[11px] font-semibold text-[#315b36] tracking-tight mt-0.5">
                  Course Studio
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-md text-[#5a5e63] hover:bg-[#eff4ec] hover:text-[#315b36] transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Toggle Button */}
        {collapsed && (
          <div className="hidden md:flex justify-center pb-1">
            <button
              onClick={toggleCollapsed}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#5a5e63] hover:bg-[#eff4ec] hover:text-[#315b36] transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        {/* Course Info Card (Expanded) */}
        {!collapsed && course && (
          <div className="rounded-xl border border-[#e2ebe2] bg-[#f8faf8] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#315b36] uppercase tracking-wider">
              <BookOpen className="h-3 w-3" />
              <span>Active Course</span>
            </div>
            <p className="text-xs font-bold text-[#2e3339] line-clamp-2 leading-tight" title={course.title}>
              {course.title}
            </p>
            {course.level && (
              <span className="inline-block mt-1 text-[10px] font-bold bg-[#e8f2e8] text-[#315b36] px-2 py-0.5 rounded-md">
                {course.level}
              </span>
            )}
          </div>
        )}

        {/* Studio Navigation Links */}
        <div>
          {!collapsed && (
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-[#7a8188] mb-2">
              Studio Menu
            </p>
          )}
          <nav className="space-y-1.5">
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
                    'flex items-center gap-3 rounded-md py-2.5 text-sm font-semibold transition-all',
                    collapsed ? 'justify-center px-2' : 'px-3',
                    isActive
                      ? 'bg-[#315b36] text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:bg-[#eff4ec] hover:text-[#315b36]'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4.5 w-4.5 shrink-0',
                      isActive ? 'text-white' : 'text-slate-400'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Navigation (Exit to Courses) */}
      <div className="border-t border-[#e2ebe2] pt-3">
        <Link
          href="/teacher/courses"
          onClick={() => setMobileSidebarOpen(false)}
          title={collapsed ? 'Back to Courses' : undefined}
          className={cn(
            'flex items-center gap-2.5 py-2.5 rounded-md text-sm font-semibold text-slate-600 hover:bg-[#eff4ec] hover:text-[#315b36] transition-colors',
            collapsed ? 'justify-center px-2' : 'px-3'
          )}
        >
          <ArrowLeft className="h-4.5 w-4.5 shrink-0 text-slate-400" />
          {!collapsed && <span>Back to Courses</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex h-screen shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop and slide-over */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 flex h-full max-w-xs flex-1 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Content Area */}
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
              <Link href="/teacher/courses" className="hover:text-[#315b36] transition-colors">
                Courses
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white truncate max-w-[200px]" title={course?.title}>
                {course?.title || 'Studio'}
              </span>
              <span>/</span>
              <span className="text-[#315b36] capitalize font-bold">
                {currentSection}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Course Studio</span>
            </div>

            {/* In-App Notifications Center Engine */}
            <NotificationCenter />

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Profile, Settings & Logout User Dropdown */}
            <UserDropdown />
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
