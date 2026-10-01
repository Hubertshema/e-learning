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
  Video,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData, clientCache } from '@/lib/cache';
import { StartLiveSessionModal } from '@/components/live-session/start-live-session-modal';

interface TeacherStats {
  totalCourses: number;
  totalClasses?: number;
  totalStudents: number;
  totalResources?: number;
  pendingPaymentsCount: number;
  pendingApplicationsCount?: number;
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

  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  const teacherMetrics = [
    {
      label: 'Live Classrooms',
      value: 'Instant',
      sub: '1-to-1 & cohort live video',
      badge: 'Live Studio',
      icon: Video,
      gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      iconBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25',
      borderColor: 'border-emerald-200/80 dark:border-emerald-900/60',
      badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold',
      href: '/teacher/live-sessions',
    },
    {
      label: 'Students Directory',
      value: stats?.totalStudents ?? 0,
      sub: (stats?.pendingApplicationsCount ?? 0) > 0
        ? `${stats?.totalStudents ?? 0} active • ${stats?.pendingApplicationsCount} pending apps`
        : 'Active learners enrolled',
      badge: (stats?.pendingApplicationsCount ?? 0) > 0 ? `${stats?.pendingApplicationsCount} New Apps` : 'Manage All',
      icon: Users,
      gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
      iconBg: 'bg-[#006EF3] text-white shadow-lg shadow-blue-600/25',
      borderColor: 'border-blue-200/80 dark:border-blue-900/60',
      badgeBg: (stats?.pendingApplicationsCount ?? 0) > 0
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-bold'
        : 'bg-blue-50 text-[#012970] dark:bg-blue-950/60 dark:text-blue-300',
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#011538] via-[#012970] to-[#006EF3] p-4 sm:p-5 text-white shadow-lg border border-blue-500/25">
        {/* Subtle Ambient Glowing Mesh Orbs */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            {/* Faculty Status Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B400] animate-pulse" />
                CEFR Faculty Command Center
              </span>

              {user?.teacherProfile?.isApproved ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-400/20 text-blue-200 border border-blue-400/30">
                  <ShieldCheck className="h-3 w-3" /> Verified Faculty
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Active Instructor
                </span>
              )}
            </div>

            {/* Time-aware Greeting */}
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {getGreeting()}{user?.firstName ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="text-[11px] sm:text-xs text-blue-100/90 leading-tight font-normal">
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
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md h-8 px-2.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              size="sm"
              onClick={() => setIsLiveModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-8 px-3 shadow-md shadow-emerald-900/30 gap-1.5"
            >
              <Video className="h-3.5 w-3.5 animate-pulse" />
              Start Live Session
            </Button>

            <Link href="/teacher/students">
              <Button
                size="sm"
                className="bg-[#F5B400] hover:bg-[#d99f00] text-[#012970] font-black text-xs h-8 px-3 shadow-md shadow-black/20 gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                Students Directory
              </Button>
            </Link>

            <Link href="/teacher/courses">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md text-xs h-8 px-3 gap-1.5 font-bold"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Courses
              </Button>
            </Link>

            <Link href="/teacher/library">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md text-xs h-8 px-3 gap-1.5 font-bold"
              >
                <Library className="h-3.5 w-3.5" />
                Resources
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Teaching Summary Strip */}
        <div className="mt-3.5 pt-3 border-t border-blue-400/20 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
          {loading && !stats ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full bg-blue-950/60" />
            ))
          ) : (
            <>
              <div className="flex items-center gap-2 text-blue-100">
                <div className="h-1.5 w-1.5 rounded-full bg-[#006EF3] animate-pulse" />
                <span>Learners: <strong>{stats?.totalStudents ?? 0} Enrolled</strong></span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <div className={`h-1.5 w-1.5 rounded-full ${(stats?.pendingPaymentsCount ?? 0) > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>Receipts: <strong>{stats?.pendingPaymentsCount ?? 0} Proofs</strong></span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <div className="h-1.5 w-1.5 rounded-full bg-[#F5B400]" />
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

      {/* Start Live Session Modal */}
      <StartLiveSessionModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        onSessionCreated={() => refresh()}
      />
    </div>
  );
}

