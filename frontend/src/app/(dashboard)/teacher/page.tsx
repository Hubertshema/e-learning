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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'SUBMISSIONS' | 'EXPIRING'>('PAYMENTS');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Expiring students data for quick tab
  const { data: expiringStudents, refresh: refreshExpiring } = useCachedData<ExpiringStudent[]>(
    'teacher_expiring_students_7',
    async () => {
      const res = await apiClient.get<ExpiringStudent[]>('/teacher/expiring-students?days=7');
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const handleApprovePayment = async (paymentId: string) => {
    try {
      setActionLoading(paymentId);
      setFeedback(null);
      await apiClient.post(`/teacher/payments/${paymentId}/approve`);
      setFeedback({ type: 'success', text: 'Payment verified & course access granted!' });

      mutate((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pendingPaymentsCount: Math.max(0, prev.pendingPaymentsCount - 1),
          recentPayments: prev.recentPayments.filter((p) => p.id !== paymentId),
        };
      }, true);

      clientCache.invalidate('teacher_');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to verify payment.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendAccess = async (enrollmentId: string) => {
    try {
      setActionLoading(enrollmentId);
      setFeedback(null);
      await apiClient.post(`/teacher/enrollments/${enrollmentId}/extend`, {
        extensionDays: 30,
        reason: 'Instant extension from Dashboard Action Center',
      });
      setFeedback({ type: 'success', text: 'Student access extended by 30 days.' });
      refreshExpiring();
      clientCache.invalidate('teacher_');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to extend access.' });
    } finally {
      setActionLoading(null);
    }
  };

  const expiringCount = expiringStudents?.length || 0;

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
      label: 'Grading Queue',
      value: stats?.pendingSubmissionsCount ?? 0,
      sub: 'Assignments awaiting review',
      badge: (stats?.pendingSubmissionsCount ?? 0) > 0 ? 'Urgent' : 'Clear',
      icon: ClipboardList,
      gradient: 'from-rose-500/15 via-rose-500/5 to-transparent',
      iconBg: 'bg-rose-600 text-white shadow-lg shadow-rose-600/25',
      borderColor: 'border-rose-200/80 dark:border-rose-900/60',
      badgeBg: (stats?.pendingSubmissionsCount ?? 0) > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold' : 'bg-slate-100 text-slate-600',
      highlight: (stats?.pendingSubmissionsCount ?? 0) > 0,
      href: '/teacher/assignments',
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
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ─── 1. Instructor Executive Command Hero ────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#112314] via-[#1a3820] to-[#0e1d11] p-6 sm:p-8 text-white shadow-2xl border border-emerald-500/25">
        {/* Subtle Ambient Glowing Mesh Orbs */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Faculty Status Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                CEFR Faculty Command Center
              </span>

              {user?.teacherProfile?.isApproved ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Faculty
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Active Instructor
                </span>
              )}

              {isValidating && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-200/70">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Live sync...
                </span>
              )}
            </div>

            {/* Time-aware Greeting */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {getGreeting()}{user?.firstName ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              Manage your cohort enrollments, grade assignments, verify student payment receipts, and organize your CEFR curriculum.
            </p>
          </div>

          {/* Quick Action Speed-Dial */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { refresh(); refreshExpiring(); }}
              disabled={isValidating}
              title="Refresh live dashboard"
              className="border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 backdrop-blur-md h-9"
            >
              <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            </Button>

            <Link href="/teacher/students">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-lg shadow-emerald-700/30 gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                Students Directory
              </Button>
            </Link>

            <Link href="/teacher/courses">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 backdrop-blur-md text-xs h-9 gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Courses
              </Button>
            </Link>

            <Link href="/teacher/library">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 backdrop-blur-md text-xs h-9 gap-1.5"
              >
                <Library className="h-3.5 w-3.5" />
                Resources
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Teaching Summary Strip */}
        <div className="mt-6 pt-5 border-t border-emerald-800/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {loading && !stats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full bg-emerald-950/60" />
            ))
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Learners: <strong>{stats?.totalStudents ?? 0} Enrolled</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className={`h-2 w-2 rounded-full ${(stats?.pendingPaymentsCount ?? 0) > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>Receipts: <strong>{stats?.pendingPaymentsCount ?? 0} Proofs</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className={`h-2 w-2 rounded-full ${(stats?.pendingSubmissionsCount ?? 0) > 0 ? 'bg-rose-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>Grading: <strong>{stats?.pendingSubmissionsCount ?? 0} Tasks</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className="h-2 w-2 rounded-full bg-sky-400" />
                <span>Levels: <strong>3 CEFR Levels</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-md animate-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px] font-bold">Dismiss</button>
        </div>
      )}

      {error && !stats && (
        <div className="flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-md bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Could not connect to live backend service. Please check your connection.</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refresh()} className="h-7 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* ─── 2. Key Metrics Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))
        ) : (
          teacherMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} href={m.href} className="group">
                <Card
                  className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg bg-white dark:bg-slate-900 ${m.borderColor} ${
                    m.highlight ? 'ring-2 ring-amber-400/50 dark:ring-amber-500/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {m.label}
                    </span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {m.value}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badgeBg}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
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

      {/* ─── 3. Main Workspace Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Action Center (Receipts, Grading, Expiring) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Instructor Action Center
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Tasks requiring immediate review, evaluation, or access renewal
                  </CardDescription>
                </div>

                {/* Segmented 3-Tab Control */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    onClick={() => setActiveTab('PAYMENTS')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      activeTab === 'PAYMENTS'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Receipts ({stats?.pendingPaymentsCount ?? 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('SUBMISSIONS')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      activeTab === 'SUBMISSIONS'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span>Grading ({stats?.pendingSubmissionsCount ?? 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('EXPIRING')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      activeTab === 'EXPIRING'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Expiring ({expiringCount})</span>
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              {loading && !stats ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : activeTab === 'PAYMENTS' ? (
                stats?.recentPayments && stats.recentPayments.length > 0 ? (
                  stats.recentPayments.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-amber-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {p.user?.firstName} {p.user?.lastName}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {p.course?.title || 'Course Enrollment'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Channel: <strong className="text-slate-700 dark:text-slate-300">{p.paymentMethod || 'Manual'}</strong> • Amount:{' '}
                            <strong className="text-slate-700 dark:text-slate-300">
                              ${p.amount} {p.currency}
                            </strong>{' '}
                            • Ref: <span className="font-mono text-slate-600 dark:text-slate-400">{p.referenceNumber}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={actionLoading === p.id}
                            onClick={() => handleApprovePayment(p.id)}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          >
                            {actionLoading === p.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-1 h-3.5 w-3.5" /> Verify &amp; Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Pending Receipts</p>
                    <p className="text-xs text-slate-400 mt-0.5">All student payments and enrollments are up to date.</p>
                  </div>
                )
              ) : activeTab === 'SUBMISSIONS' ? (
                stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
                  stats.recentSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-rose-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {sub.student?.firstName} {sub.student?.lastName}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-200 text-rose-600 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                              Max {sub.assignment?.maxScore || 100} Pts
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {sub.assignment?.title || 'Course Assignment'}
                          </p>
                        </div>

                        <Link href={`/teacher/assignments?submissionId=${sub.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/50">
                            Evaluate &amp; Grade <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Grading Inbox Clear</p>
                    <p className="text-xs text-slate-400 mt-0.5">All submitted student tasks and homework have been graded.</p>
                  </div>
                )
              ) : (
                /* Expiring Watchlist Tab */
                expiringStudents && expiringStudents.length > 0 ? (
                  expiringStudents.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-amber-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {item.student?.user?.firstName} {item.student?.user?.lastName}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                              {item.course?.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Expires: <strong>{new Date(item.expiresAt).toLocaleDateString()}</strong> • {item.student?.user?.email}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === item.id}
                          onClick={() => handleExtendAccess(item.id)}
                          className="h-8 text-xs font-bold border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 gap-1"
                        >
                          {actionLoading === item.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CalendarCheck className="h-3.5 w-3.5" />
                              Extend 30 Days
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Expiring Enrollments</p>
                    <p className="text-xs text-slate-400 mt-0.5">No student accesses are expiring in the next 7 days.</p>
                  </div>
                )
              )}
            </CardContent>

            <CardFooter className="border-t border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live database synchronization
              </span>
              <Link
                href="/teacher/students"
                className="font-bold text-[#315b36] dark:text-emerald-400 flex items-center hover:underline"
              >
                Open Unified Students Directory <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </CardFooter>
          </Card>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/teacher/students" className="group">
              <Card className="p-4 rounded-2xl transition-all hover:border-[#315b36] hover:shadow-md bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#315b36] dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:bg-[#315b36] group-hover:text-white transition-colors">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#315b36] dark:group-hover:text-emerald-400 transition-colors">
                      Students Directory
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Access &amp; Watchlist</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/teacher/levels" className="group">
              <Card className="p-4 rounded-2xl transition-all hover:border-[#315b36] hover:shadow-md bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:bg-[#315b36] group-hover:text-white transition-colors">
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#315b36] dark:group-hover:text-emerald-400 transition-colors">
                      Learning Levels
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">CEFR levels structure</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/teacher/library" className="group">
              <Card className="p-4 rounded-2xl transition-all hover:border-[#315b36] hover:shadow-md bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:bg-[#315b36] group-hover:text-white transition-colors">
                    <Library className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#315b36] dark:group-hover:text-emerald-400 transition-colors">
                      Resource Library
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">PDFs, videos &amp; docs</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Column (4 cols): Active Cohorts & 7-Skill Matrix */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Levels Overview */}
          <Card className="rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-[#315b36] dark:text-emerald-400" />
                  Learning Levels
                </CardTitle>
                <Link href="/teacher/levels">
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-[#315b36] dark:text-emerald-400 h-7 px-2">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              {[
                { id: '1', name: 'Level 1: Fundamentals (A1-A2)', tag: 'Beginner' },
                { id: '2', name: 'Level 2: Intermediate (B1-B2)', tag: 'Intermediate' },
                { id: '3', name: 'Level 3: Advanced Mastery (C1)', tag: 'Advanced' }
              ].map((level) => (
                <div
                  key={level.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-1.5 transition-all hover:border-emerald-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{level.name}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-[#315b36] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                      {level.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>CEFR Structured Syllabus</span>
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 7-Skill English Proficiency Matrix Banner */}
          <Card className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#122416] via-[#1a3820] to-[#0e1d11] border border-emerald-500/25 text-white shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  7-Skill CEFR English Framework
                </span>
              </div>
              <h3 className="text-base font-bold tracking-tight">Student Proficiency Matrix</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed font-normal">
                Live performance aggregated across Grammar, Vocabulary, Reading, Listening, Writing, Speaking, and Pronunciation.
              </p>

              {loading && !stats ? (
                <div className="space-y-3 pt-2">
                  <Skeleton className="h-4 w-full bg-emerald-950/60" />
                  <Skeleton className="h-4 w-full bg-emerald-950/60" />
                  <Skeleton className="h-4 w-full bg-emerald-950/60" />
                </div>
              ) : stats?.skillProficiency && stats.skillProficiency.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {stats.skillProficiency.slice(0, 4).map((s) => (
                    <div key={s.skill} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-emerald-200">
                        <span>{s.skill}</span>
                        <span className="font-bold text-white">{s.score}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-emerald-950/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(s.score, 0))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center rounded-xl bg-emerald-950/40 p-3 border border-emerald-500/20">
                  <p className="text-xs text-emerald-200">Skill benchmarks update automatically as enrolled students complete exercises.</p>
                </div>
              )}

              <Link href="/teacher/students" className="block pt-2">
                <Button size="sm" className="w-full text-xs font-bold shadow-md bg-emerald-500 hover:bg-emerald-400 text-slate-950">
                  Explore Student CEFR Diagnostics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
