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
  ArrowLeft,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface CourseInfo {
  id: string;
  title: string;
  level: string;
  isPublished?: boolean;
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const courseId = params.courseId as string;
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Navbar Header */}
      <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 md:px-7 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Logo & Studio Brand */}
          <Link
            href="/teacher/courses"
            className="flex items-center gap-2.5 group shrink-0"
            title="Course Studio - LinguaChris"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-slate-800 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs p-1 transition-transform group-hover:scale-105">
              <img
                src="/logo.png"
                alt="LinguaChris Academy"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  LinguaChris
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-2 w-2" /> Studio
                </span>
              </div>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Breadcrumb Path & Exit Button */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-hidden">
            <Link
              href="/teacher/courses"
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Back to Courses"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-bold">Courses</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[280px] font-bold" title={course?.title}>
              {course?.title || 'Course'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 px-2.5 py-0.5 text-[11px] font-bold text-[#1f4325] dark:text-emerald-400 capitalize shrink-0">
              <BookOpen className="h-3 w-3" />
              {currentSection}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Course Level Indicator */}
          {course?.level && (
            <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              {course.level.startsWith('Level') ? course.level : `Level ${course.level}`}
            </span>
          )}

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
  );
}


