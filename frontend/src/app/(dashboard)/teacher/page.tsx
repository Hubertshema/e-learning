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
  GraduationCap
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

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'SUBMISSIONS'>('PAYMENTS');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Use Stale-While-Revalidate caching for instant rendering and background sync
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
      ttl: 60000, // 1 minute local cache TTL
      revalidateOnFocus: true,
    }
  );

  const handleApprovePayment = async (paymentId: string) => {
    try {
      setActionLoading(paymentId);
      setFeedback(null);
      await apiClient.post(`/teacher/payments/${paymentId}/approve`);
      setFeedback({ type: 'success', text: 'Payment receipt verified and course access granted to student!' });

      // Optimistic cache update + background revalidation
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

  const teacherMetrics = [
    {
      label: 'Active Students',
      value: stats?.totalStudents ?? 0,
      sub: 'Enrolled across all classes',
      icon: Users,
      gradient: 'from-indigo-600/15 via-indigo-500/5 to-transparent',
      iconBg: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
      borderColor: 'border-indigo-200/60 dark:border-indigo-900/60',
      href: '/teacher/students',
    },
    {
      label: 'Published Courses',
      value: stats?.totalCourses ?? 0,
      sub: 'Active CEFR syllabi',
      icon: BookOpen,
      gradient: 'from-blue-600/15 via-blue-500/5 to-transparent',
      iconBg: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30',
      borderColor: 'border-blue-200/60 dark:border-blue-900/60',
      href: '/teacher/courses',
    },
    {
      label: 'Pending Receipts',
      value: stats?.pendingPaymentsCount ?? 0,
      sub: 'Awaiting verification',
      icon: CreditCard,
      gradient: 'from-amber-600/15 via-amber-500/5 to-transparent',
      iconBg: 'bg-amber-600 text-white shadow-lg shadow-amber-500/30',
      borderColor: 'border-amber-200/60 dark:border-amber-900/60',
      highlight: (stats?.pendingPaymentsCount ?? 0) > 0,
      href: '/teacher/payments',
    },
    {
      label: 'Grading Queue',
      value: stats?.pendingSubmissionsCount ?? 0,
      sub: 'Submissions to grade',
      icon: ClipboardList,
      gradient: 'from-rose-600/15 via-rose-500/5 to-transparent',
      iconBg: 'bg-rose-600 text-white shadow-lg shadow-rose-500/30',
      borderColor: 'border-rose-200/60 dark:border-rose-900/60',
      highlight: (stats?.pendingSubmissionsCount ?? 0) > 0,
      href: '/teacher/assignments',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Instructor Command Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-[#132519] p-6 sm:p-8 text-white shadow-2xl border border-[#3B6748]/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo" className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 font-mono text-[11px] px-3 py-1">
                🎓 Instructor Command Center
              </Badge>
              {user?.teacherProfile?.isApproved ? (
                <Badge variant="success" className="text-[11px] px-2.5 py-0.5 font-bold">
                  ✓ Verified Faculty Member
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[11px] px-2.5 py-0.5">
                  Instructor Active
                </Badge>
              )}
              {isValidating && (
                <span className="flex items-center gap-1 text-[11px] text-indigo-300/80">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Syncing...
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back{user?.firstName ? `, ${user.firstName} ${user.lastName || ''}` : ''}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Manage your CEFR course cohorts, evaluate 7-skill homework submissions, verify student payment receipts, and launch AI assistance.
            </p>
          </div>

          {/* Quick Action Speed-Dial */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={isValidating}
              title="Refresh live dashboard data"
              className="border-indigo-400/40 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800/60 backdrop-blur-md"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/teacher/lessons/create">
              <Button variant="outline" size="sm" className="border-indigo-400/40 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800/60 backdrop-blur-md">
                <Plus className="mr-1.5 h-3.5 w-3.5 text-indigo-300" />
                Create Lesson
              </Button>
            </Link>
            <Link href="/teacher/attendance">
              <Button variant="outline" size="sm" className="border-indigo-400/40 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800/60 backdrop-blur-md">
                <CalendarCheck className="mr-1.5 h-3.5 w-3.5 text-indigo-300" />
                Attendance
              </Button>
            </Link>
            <Link href="/teacher/quizzes">
              <Button variant="outline" size="sm" className="border-indigo-400/40 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800/60 backdrop-blur-md">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-indigo-300" />
                Quizzes
              </Button>
            </Link>
            <Link href="/teacher/ai">
              <Button variant="gradient" size="sm" className="shadow-lg shadow-indigo-600/40">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                AI Assistant
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Teaching Summary Strip */}
        <div className="mt-6 pt-5 border-t border-indigo-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {loading && !stats ? (
            <>
              <Skeleton className="h-5 w-full bg-indigo-800/50" />
              <Skeleton className="h-5 w-full bg-indigo-800/50" />
              <Skeleton className="h-5 w-full bg-indigo-800/50" />
              <Skeleton className="h-5 w-full bg-indigo-800/50" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-indigo-200">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Learners: <strong>{stats?.totalStudents ?? 0} Students</strong></span>
              </div>
              <div className="flex items-center gap-2 text-indigo-200">
                <div className={`h-2 w-2 rounded-full ${(stats?.pendingPaymentsCount ?? 0) > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>Pending Receipts: <strong>{stats?.pendingPaymentsCount ?? 0} Proofs</strong></span>
              </div>
              <div className="flex items-center gap-2 text-indigo-200">
                <div className={`h-2 w-2 rounded-full ${(stats?.pendingSubmissionsCount ?? 0) > 0 ? 'bg-rose-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>Grading Queue: <strong>{stats?.pendingSubmissionsCount ?? 0} Items</strong></span>
              </div>
              <div className="flex items-center gap-2 text-indigo-200">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span>Learning Levels: <strong>3 Fixed Levels</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
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

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-36" />
              </div>
            </Card>
          ))
        ) : (
          teacherMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} href={m.href}>
                <Card
                  className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl bg-white dark:bg-slate-900 ${m.borderColor} backdrop-blur-sm ${
                    m.highlight ? 'ring-2 ring-amber-400/60 dark:ring-amber-500/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {m.label}
                    </span>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.iconBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {m.value}
                      </span>
                      <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 flex items-center">
                        Manage <ChevronRight className="h-3 w-3 ml-0.5" />
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                      {m.sub}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Action Attention Center (Tabs: Payments & Grading) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Urgent Action Inbox
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Items requiring your immediate review and instructor evaluation
                  </CardDescription>
                </div>

                {/* Segmented Tab Switcher */}
                <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    onClick={() => setActiveTab('PAYMENTS')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      activeTab === 'PAYMENTS'
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Receipts ({stats?.pendingPaymentsCount ?? 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('SUBMISSIONS')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      activeTab === 'SUBMISSIONS'
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span>Grading ({stats?.pendingSubmissionsCount ?? 0})</span>
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3.5">
              {loading && !stats ? (
                <div className="space-y-3 py-2">
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-8 w-28 rounded-lg" />
                    </div>
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-8 w-28 rounded-lg" />
                    </div>
                    <Skeleton className="h-3 w-64" />
                  </div>
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
                            <Badge variant="indigo" className="text-[10px] py-0">
                              {p.course?.title || 'Course Enrollment'}
                            </Badge>
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
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          >
                            {actionLoading === p.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-1 h-3.5 w-3.5" /> Verify & Activate
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
              ) : (
                /* Submissions Tab */
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
                            <Badge variant="outline" className="text-[10px] py-0 border-rose-300 text-rose-600">
                              Max {sub.assignment?.maxScore || 100} Pts
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {sub.assignment?.title || 'Course Assignment'}
                          </p>
                        </div>

                        <Link href={`/teacher/assignments?submissionId=${sub.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/50">
                            Evaluate & Grade <ArrowRight className="h-3 w-3 ml-1" />
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
              )}
            </CardContent>

            <CardFooter className="border-t border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs">
              <span className="text-slate-500">Real-time sync with database</span>
              <Link
                href={activeTab === 'PAYMENTS' ? '/teacher/payments' : '/teacher/assignments'}
                className="font-bold text-primary-600 flex items-center hover:underline"
              >
                Open Full {activeTab === 'PAYMENTS' ? 'Payment Ledger' : 'Grading Suite'} <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </CardFooter>
          </Card>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/teacher/levels" className="group">
              <Card className="p-4 rounded-2xl transition-all hover:border-primary-500 hover:shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <FolderTree className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      Learning Levels
                    </h3>
                    <p className="text-[10px] text-slate-500">Manage course access</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/teacher/feedback" className="group">
              <Card className="p-4 rounded-2xl transition-all hover:border-primary-500 hover:shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      Coaching Notes
                    </h3>
                    <p className="text-[10px] text-slate-500">Student feedback & tips</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/teacher/library" className="group">
              <Card className="p-4 rounded-2xl transition-all hover:border-primary-500 hover:shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <Library className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      Resource Library
                    </h3>
                    <p className="text-[10px] text-slate-500">Audio, PDFs & worksheets</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Column (4 cols): Active Cohorts & 7-Skill Matrix */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Levels Overview */}
          <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-indigo-600" />
                  Learning Levels
                </CardTitle>
                <Link href="/teacher/levels">
                  <Button variant="ghost" size="sm" className="text-xs text-primary-600">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3.5">
              <div className="space-y-3">
                {[
                  { id: '1', name: 'Level 1: Fundamentals', students: 120, courses: 4 },
                  { id: '2', name: 'Level 2: Intermediate', students: 85, courses: 6 },
                  { id: '3', name: 'Level 3: Advanced', students: 40, courses: 5 }
                ].map((level) => (
                  <div
                    key={level.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2 transition-all hover:border-indigo-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{level.name}</span>
                      <Badge variant="indigo" className="text-[10px] py-0">
                        {level.students} Students
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{level.courses} Default Courses</span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 7-Skill English Proficiency Matrix Banner */}
          <Card className="rounded-2xl overflow-hidden bg-[#132519] border border-[#3B6748]/30 text-white shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  7-Skill CEFR English Framework
                </span>
              </div>
              <h3 className="text-base font-bold tracking-tight">Student Proficiency Matrix</h3>
              <p className="text-xs text-indigo-100/80 leading-relaxed">
                Live performance aggregated across Grammar, Vocabulary, Reading, Listening, Writing, Speaking, and Pronunciation.
              </p>

              {loading && !stats ? (
                <div className="space-y-3 pt-2">
                  <Skeleton className="h-4 w-full bg-indigo-800/60" />
                  <Skeleton className="h-4 w-full bg-indigo-800/60" />
                  <Skeleton className="h-4 w-full bg-indigo-800/60" />
                </div>
              ) : stats?.skillProficiency && stats.skillProficiency.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {stats.skillProficiency.slice(0, 4).map((s) => (
                    <div key={s.skill} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-indigo-200">
                        <span>{s.skill}</span>
                        <span className="font-bold text-white">{s.score}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-indigo-950/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(s.score, 0))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center rounded-xl bg-indigo-950/40 p-3">
                  <p className="text-xs text-indigo-200">Skill benchmarks update automatically as enrolled students complete exercises.</p>
                </div>
              )}

              <Link href="/teacher/progress" className="block pt-2">
                <Button size="sm" variant="secondary" className="w-full text-xs font-bold shadow-md">
                  Launch 7-Skill Analytics Suite
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
