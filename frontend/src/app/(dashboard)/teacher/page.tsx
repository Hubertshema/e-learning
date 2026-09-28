'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  BookOpen,
  CreditCard,
  ClipboardList,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  AlertCircle,
  Calendar,
  Sparkles,
  CalendarCheck,
  Check,
  ChevronRight,
  RefreshCw,
  FolderTree,
  MessageSquare,
  Library,
  Zap,
  GraduationCap,
  ShieldCheck,
  Award,
  ArrowUpRight,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData, clientCache } from '@/lib/cache';

interface TeacherStats {
  totalCourses: number;
  totalClasses?: number;
  totalStudents: number;
  totalResources?: number;
  pendingPaymentsCount: number;
  pendingSubmissionsCount: number;
  expiringStudentsCount?: number;
  skillProficiency?: Array<{
    skill: string;
    score: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    referenceNumber: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    course?: {
      title: string;
      level: string;
    };
  }>;
  recentSubmissions: Array<{
    id: string;
    submittedAt: string;
    status: string;
    assignment: {
      title: string;
      maxScore: number;
    };
    student: {
      firstName: string;
      lastName: string;
    };
  }>;
  upcomingClasses: Array<{
    id: string;
    name: string;
    schedule: string;
    _count: {
      enrollments: number;
    };
  }>;
}

interface ExpiringStudent {
  id: string;
  expiresAt: string;
  student: { user: { firstName: string; lastName: string; email: string } };
  course: { title: string; level: string };
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Stale-While-Revalidate caching for live dashboard data
  const {
    data: stats,
    loading,
    isValidating,
    error,
    refresh,
    mutate,
  } = useCachedData<TeacherStats>(
    user ? `teacher_dashboard_${user.id}` : null,
    async () => {
      const res = await apiClient.get<TeacherStats>('/teacher/dashboard');
      return res;
    },
    {
      ttl: 60000,
      revalidateOnFocus: true,
    }
  );

  const teacherMetrics = [
    {
      label: 'Students Directory',
      value: stats?.totalStudents ?? 0,
      sub: 'Active learners enrolled',
      badge: 'Manage All',
      icon: Users,
      gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      iconBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25',
      borderColor: 'border-emerald-200/80 dark:border-emerald-900/60',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      href: '/teacher/students',
    },
    {
      label: 'Curriculum Syllabi',
      value: stats?.totalCourses ?? 0,
      sub: 'Published CEFR courses',
      badge: 'Course Studio',
      icon: BookOpen,
      gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
      iconBg: 'bg-blue-600 text-white shadow-lg shadow-blue-600/25',
      borderColor: 'border-blue-200/80 dark:border-blue-900/60',
      badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      href: '/teacher/courses',
    },
    {
      label: 'Resource Library',
      value: stats?.totalResources ?? 0,
      sub: 'PDFs & interactive videos',
      badge: 'Library',
      icon: Library,
      gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
      iconBg: 'bg-amber-600 text-white shadow-lg shadow-amber-600/25',
      borderColor: 'border-amber-200/80 dark:border-amber-900/60',
      badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      href: '/teacher/library',
    },
    {
      label: 'Pending Receipts',
      value: stats?.pendingPaymentsCount ?? 0,
      sub: 'Proofs awaiting activation',
      badge: (stats?.pendingPaymentsCount ?? 0) > 0 ? 'Action Needed' : 'Verified',
      icon: CreditCard,
      gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
      iconBg: 'bg-amber-600 text-white shadow-lg shadow-amber-600/25',
      borderColor: 'border-amber-200/80 dark:border-amber-900/60',
      badgeBg: (stats?.pendingPaymentsCount ?? 0) > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold' : 'bg-slate-100 text-slate-600',
      highlight: (stats?.pendingPaymentsCount ?? 0) > 0,
      href: '/teacher/students?tab=enrollments',
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-300">
      {/* ─── 1. Instructor Executive Command Hero ────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#112314] via-[#1a3820] to-[#0e1d11] p-4 sm:p-5 text-white shadow-lg border border-emerald-500/25">
        {/* Subtle Ambient Glowing Mesh Orbs */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            {/* Faculty Status Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CEFR Faculty Command Center
              </span>

              {user?.teacherProfile?.isApproved ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="h-3 w-3" /> Verified Faculty
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Active Instructor
                </span>
              )}

              {isValidating && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-200/70">
                  <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Live sync...
                </span>
              )}
            </div>

            {/* Time-aware Greeting */}
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {getGreeting()}{user?.firstName ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-tight font-normal">
              Manage your cohort enrollments, grade assignments, verify student payment receipts, and organize your CEFR curriculum.
            </p>
          </div>

          {/* Quick Action Speed-Dial */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={isValidating}
              title="Refresh live dashboard"
              className="border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 backdrop-blur-md h-8 px-2.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            </Button>

            <Link href="/teacher/students">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3 shadow-md shadow-emerald-700/30 gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                Students Directory
              </Button>
            </Link>

            <Link href="/teacher/courses">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 backdrop-blur-md text-xs h-8 px-3 gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Courses
              </Button>
            </Link>

            <Link href="/teacher/library">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 backdrop-blur-md text-xs h-8 px-3 gap-1.5"
              >
                <Library className="h-3.5 w-3.5" />
                Resources
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Teaching Summary Strip */}
        <div className="mt-3.5 pt-3 border-t border-emerald-800/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
          {loading && !stats ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full bg-emerald-950/60" />
            ))
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Learners: <strong>{stats?.totalStudents ?? 0} Enrolled</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className={`h-1.5 w-1.5 rounded-full ${(stats?.pendingPaymentsCount ?? 0) > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>Receipts: <strong>{stats?.pendingPaymentsCount ?? 0} Proofs</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>Courses: <strong>{stats?.totalCourses ?? 0} Published</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && !stats && (
        <div className="flex items-center justify-between rounded-xl p-3 text-xs font-semibold shadow-sm bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Could not connect to live backend service. Please check your connection.</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refresh()} className="h-6 text-[11px] px-2">
            Retry
          </Button>
        </div>
      )}

      {/* ─── 2. Key Metrics Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-2.5 w-24" />
            </Card>
          ))
        ) : (
          teacherMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} href={m.href} className="group">
                <Card
                  className={`relative overflow-hidden p-3.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white dark:bg-slate-900 ${m.borderColor} ${
                    m.highlight ? 'ring-2 ring-amber-400/50 dark:ring-amber-500/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {m.label}
                    </span>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${m.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="mt-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        {m.value}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.badgeBg}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-1.5 flex items-center justify-between">
                      <span>{m.sub}</span>
                      <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

