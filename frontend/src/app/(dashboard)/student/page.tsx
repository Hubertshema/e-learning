'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  GraduationCap,
  ShieldCheck,
  Award,
  PlayCircle,
  Play,
  ChevronRight,
  Check,
  AlertCircle,
  FileCheck,
  Sparkles,
  Video,
  Radio,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData } from '@/lib/cache';
import { getSocketClient } from '@/lib/socket-client';
import { AdmissionStatusView, AdmissionStatusData } from '@/components/student/admission-status-view';

interface DashboardData {
  profile: {
    id: string;
    currentLevel: string;
    targetLevel?: string;
    nativeLanguage?: string;
    learningGoals: string[];
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  stats: {
    activeCoursesCount: number;
    totalEnrolledCount: number;
    completedCoursesCount: number;
    completedLessonsCount: number;
    studyTimeMinutes: number;
    studyTimeHours: number;
    streakDays: number;
    totalActivityHoursText: string;
    overallProgressPercentage: number;
    growthPercentage: number;
    goalDistance: number;
    hasTakenPlacementTest: boolean;
    latestPlacementScore: number | null;
    recommendedLevel: string | null;
  };
  inProgressCourse?: {
    id: string;
    status: string;
    totalUnitsCount: number;
    totalLessonsCount: number;
    completedLessonsCount: number;
    progressPercentage: number;
    course: {
      id: string;
      title: string;
      level: string;
      teacher?: {
        user: {
          firstName: string;
          lastName: string;
          avatarUrl?: string;
        };
      };
    };
    nextLesson?: {
      id: string;
      title: string;
      skill: string;
      durationMinutes: number;
    } | null;
  } | null;
  activeEnrollments: Array<{
    id: string;
    courseId: string;
    title: string;
    level: string;
    status: string;
    teacher?: {
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  }>;
  feedbacks?: Array<{
    id: string;
    title: string;
    content: string;
    strengths: string[];
    improvements: string[];
    createdAt: string;
    teacher: {
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  }>;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();

  // Dynamic time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Stale-While-Revalidate caching for student dashboard data
  const {
    data: dashboardData,
    loading,
    isValidating,
    error,
    refresh,
  } = useCachedData<DashboardData>(
    user ? `student_dashboard_${user.id}` : null,
    async () => {
      const res = await apiClient.get<any>('/student/dashboard');
      return (res as any)?.data || res;
    },
    {
      ttl: 60000,
      revalidateOnFocus: true,
    }
  );

  // Admission & Payment Requirement Status
  const {
    data: admissionStatus,
    loading: admissionLoading,
    refresh: refreshAdmission,
  } = useCachedData<AdmissionStatusData>(
    user ? `student_admission_${user.id}` : null,
    async () => {
      const res = await apiClient.get<any>('/student/admission-status');
      return (res as any)?.data || res;
    },
    {
      ttl: 30000,
      revalidateOnFocus: true,
    }
  );

  const studentFirstName = dashboardData?.profile?.user?.firstName || user?.firstName || 'Learner';
  const currentLevel = dashboardData?.profile?.currentLevel || 'Unknown Level';
  const targetLevel = dashboardData?.profile?.targetLevel || 'Unknown Goal';
  const stats = dashboardData?.stats;
  const inProgress = dashboardData?.inProgressCourse;
  const enrollments = dashboardData?.activeEnrollments || [];
  const feedbacks = dashboardData?.feedbacks || [];

  // Real-time live sessions invited to student
  const [liveSessions, setLiveSessions] = useState<any[]>([]);

  const fetchLiveSessions = async () => {
    try {
      const res = await apiClient.get<any[]>('/live-sessions/student');
      if (Array.isArray(res)) {
        setLiveSessions(res);
      }
    } catch {}
  };

  useEffect(() => {
    fetchLiveSessions();
    const socket = getSocketClient();
    if (socket) {
      const handleUpdate = () => fetchLiveSessions();
      socket.on('live:session-created', handleUpdate);
      socket.on('live:session-started', handleUpdate);
      socket.on('live:session-status-changed', handleUpdate);
      socket.on('live:session-ended', handleUpdate);
      return () => {
        socket.off('live:session-created', handleUpdate);
        socket.off('live:session-started', handleUpdate);
        socket.off('live:session-status-changed', handleUpdate);
        socket.off('live:session-ended', handleUpdate);
      };
    }
  }, []);

  const activeLiveSession = liveSessions.find((s: any) => s.status === 'LIVE');
  const upcomingLiveSession = liveSessions.find((s: any) => s.status === 'UPCOMING');

  // Key metrics aligned directly with teacher-provided services
  const studentMetrics = [
    {
      label: 'Enrolled Courses',
      value: stats?.activeCoursesCount ?? enrollments.length ?? 0,
      sub: `${currentLevel} curriculum`,
      badge: currentLevel,
      icon: BookOpen,
      iconBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25',
      borderColor: 'border-emerald-200/80 dark:border-emerald-900/60',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold',
      href: '/student/my-courses',
    },
    {
      label: 'Lessons Completed',
      value: stats?.completedLessonsCount ?? 0,
      sub: `${stats?.overallProgressPercentage ?? 0}% overall syllabus`,
      badge: `${stats?.overallProgressPercentage ?? 0}% Done`,
      icon: CheckCircle2,
      iconBg: 'bg-blue-600 text-white shadow-lg shadow-blue-600/25',
      borderColor: 'border-blue-200/80 dark:border-blue-900/60',
      badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold',
      href: '/student/my-courses',
    },
    {
      label: 'Tracked Study Time',
      value: `${stats?.studyTimeHours ?? 0}h`,
      sub: stats?.totalActivityHoursText || `${stats?.studyTimeMinutes ?? 0} minutes practice`,
      badge: 'Video & Audio',
      icon: Clock,
      iconBg: 'bg-amber-600 text-white shadow-lg shadow-amber-600/25',
      borderColor: 'border-amber-200/80 dark:border-amber-900/60',
      badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold',
      href: '/student/my-courses',
    },
    {
      label: 'Certificates & Goals',
      value: targetLevel.split(' ')[0] || 'TBD',
      sub: `${stats?.goalDistance ?? 0}% to completion`,
      badge: 'Accredited',
      icon: Award,
      iconBg: 'bg-purple-600 text-white shadow-lg shadow-purple-600/25',
      borderColor: 'border-purple-200/80 dark:border-purple-900/60',
      badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold',
      href: '/student/certificates',
    },
  ];

  // ─── ADMISSION & PAYMENT GATING ───────────────────────────────────────────
  if (admissionStatus && admissionStatus.learningAccess !== 'ACTIVE') {
    return (
      <AdmissionStatusView
        status={admissionStatus}
        studentName={studentFirstName}
        studentEmail={user?.email || ''}
        onRefresh={async () => {
          await refreshAdmission();
          await refresh();
        }}
      />
    );
  }

  // Determine resume target link
  const resumeHref = inProgress?.course?.id
    ? `/student/learn/${inProgress.course.id}${inProgress.nextLesson?.id ? `?lessonId=${inProgress.nextLesson.id}` : ''}`
    : '/student/my-courses';

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-300">
      {/* ─── 1. Student Executive Command Hero ────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#011538] via-[#012970] to-[#006EF3] p-4 sm:p-5 text-white shadow-lg border border-blue-500/25">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B400] animate-pulse" />
                CEFR Interactive Learning Hub
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-400/20 text-blue-200 border border-blue-400/30">
                <ShieldCheck className="h-3 w-3" /> {currentLevel} Verified
              </span>
            </div>

            {/* Time-aware Greeting */}
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {getGreeting()}, {studentFirstName}!
            </h1>
            <p className="text-[11px] sm:text-xs text-blue-100/90 leading-tight font-normal">
              Pick up right where you left off, review personalized instructor feedback, and complete your assigned curriculum modules.
            </p>
          </div>

          {/* Quick Action Speed-Dial */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={isValidating}
              title="Refresh live learning dashboard"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md h-8 px-2.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            </Button>

            {activeLiveSession ? (
              <Link href={`/live/${activeLiveSession.id}`}>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-8 px-3 shadow-md shadow-emerald-900/30 gap-1.5 animate-pulse"
                >
                  <Video className="h-3.5 w-3.5" />
                  Join Live Now
                </Button>
              </Link>
            ) : (
              <Link href="/student/live-sessions">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md text-xs h-8 px-3 gap-1.5 font-bold"
                >
                  <Video className="h-3.5 w-3.5" />
                  Live Sessions
                </Button>
              </Link>
            )}

            {inProgress?.course?.id && (
              <Link href={resumeHref}>
                <Button
                  size="sm"
                  className="bg-[#F5B400] hover:bg-[#d99f00] text-[#012970] font-black text-xs h-8 px-3 shadow-md shadow-black/20 gap-1.5"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Resume Lesson
                </Button>
              </Link>
            )}

            <Link href="/student/my-courses">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md text-xs h-8 px-3 gap-1.5 font-bold"
              >
                <BookOpen className="h-3.5 w-3.5" />
                My Courses
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Learning Summary Strip */}
        <div className="mt-3.5 pt-3 border-t border-blue-400/20 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
          {loading && !dashboardData ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full bg-blue-950/60" />
            ))
          ) : (
            <>
              <div className="flex items-center gap-2 text-blue-100">
                <div className="h-1.5 w-1.5 rounded-full bg-[#006EF3] animate-pulse" />
                <span>Enrolled: <strong>{stats?.activeCoursesCount ?? enrollments.length} Courses</strong></span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <div className="h-1.5 w-1.5 rounded-full bg-[#F5B400]" />
                <span>Completed: <strong>{stats?.completedLessonsCount ?? 0} Lessons</strong></span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                <span>Practice: <strong>{stats?.studyTimeHours ?? 0} Hours Logged</strong></span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                <span>Overall: <strong>{stats?.overallProgressPercentage ?? 0}% Mastered</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Priority Active Live Session Section ────────────────────────── */}
      {activeLiveSession && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-400/50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 backdrop-blur-md">
              <Radio className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-emerald-900 uppercase tracking-wide">
                  LIVE SESSION ACTIVE
                </span>
                <span className="text-xs text-emerald-100 font-medium truncate">
                  Instructor {activeLiveSession.teacherFirstName || activeLiveSession.teacher?.firstName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black mt-0.5 truncate">{activeLiveSession.title}</h2>
              {activeLiveSession.topic && (
                <p className="text-xs text-emerald-100/90 line-clamp-1 truncate">{activeLiveSession.topic}</p>
              )}
            </div>
          </div>
          <Link href={`/live/${activeLiveSession.id}`} className="shrink-0">
            <Button className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-900 font-black px-5 py-2.5 h-auto shadow-lg shadow-black/20 gap-2">
              <Play className="h-4 w-4 fill-current" />
              <span>Join Live Session</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Network Error Toast */}
      {error && !dashboardData && (
        <div className="flex items-center justify-between rounded-xl p-3 text-xs font-semibold shadow-sm bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Could not connect to live learning service. Please check your connection.</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refresh()} className="h-6 text-[11px] px-2">
            Retry
          </Button>
        </div>
      )}

      {/* ─── 2. Key Metrics Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading && !dashboardData ? (
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
          studentMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} href={m.href} className="group">
                <Card
                  className={`relative overflow-hidden p-3.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white dark:bg-slate-900 ${m.borderColor}`}
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

      {/* ─── 3. Main Workspace Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): In-Progress Course & Active Curricula */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card: Current In-Progress Course with 1-Click Direct Resume */}
          {inProgress?.course ? (
            <Card className="rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3F7FC] text-[#006EF3] dark:bg-slate-800 dark:text-blue-400">
                      <PlayCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Current Learning Curriculum</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F3F7FC] text-[#012970] dark:bg-slate-800 dark:text-blue-300 border border-[#E2E8F0] dark:border-slate-700">
                          {inProgress.course.level || currentLevel}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        {inProgress.course.title}
                      </CardDescription>
                    </div>
                  </div>

                  <Link href="/student/my-courses">
                    <Button variant="outline" size="sm" className="h-7 text-xs font-bold border-slate-200 dark:border-slate-800 gap-1">
                      <span>All Courses</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Course Syllabus Mastery
                    </span>
                    <span className="font-bold text-[#012970] dark:text-blue-400">
                      {inProgress.progressPercentage}% Complete ({inProgress.completedLessonsCount} of {inProgress.totalLessonsCount} lessons)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#012970] to-[#006EF3] transition-all duration-700"
                      style={{ width: `${inProgress.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Next Lesson Box with Direct 1-Click Launch */}
                <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-[#F3F7FC] via-white to-blue-50/30 p-4 dark:border-blue-900/50 dark:bg-slate-900/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#006EF3] text-white shadow-2xs">
                          Next Lesson
                        </span>
                        {inProgress.nextLesson?.durationMinutes && (
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {inProgress.nextLesson.durationMinutes} mins
                          </span>
                        )}
                        {inProgress.nextLesson?.skill && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {inProgress.nextLesson.skill}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {inProgress.nextLesson?.title || 'Interactive Lesson Curriculum'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Instructor: <strong className="text-slate-800 dark:text-slate-200">
                          {inProgress.course.teacher?.user?.firstName || 'Faculty'} {inProgress.course.teacher?.user?.lastName || 'Instructor'}
                        </strong> • CEFR Accredited
                      </p>
                    </div>

                    <Link href={resumeHref} className="shrink-0 w-full sm:w-auto">
                      <Button
                        size="sm"
                        className="bg-[#006EF3] hover:bg-[#0058c4] text-white font-bold text-xs px-4 h-9 shadow-md shadow-blue-700/25 gap-2 w-full sm:w-auto"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Resume Lesson</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3] dark:bg-slate-800 dark:text-blue-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Ready to Start Learning
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your instructor will assign your first course syllabus or you can explore enrolled courses.
                </p>
              </div>
              <Link href="/student/my-courses">
                <Button size="sm" className="bg-[#012970] hover:bg-[#006EF3] text-white text-xs font-bold mt-2 transition-colors">
                  Browse My Courses
                </Button>
              </Link>
            </Card>
          )}

          {/* Enrolled Courses Published by Teachers */}
          <Card className="rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[#006EF3] dark:text-blue-400" />
                    <span>My Enrolled Curricula ({enrollments.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Courses and learning levels assigned by your instructors
                  </CardDescription>
                </div>
                <Link href="/student/my-courses">
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-[#006EF3] dark:text-blue-400 h-7 px-2">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {enrollments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {enrollments.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F3F7FC] text-[#012970] dark:bg-slate-800 dark:text-blue-300 border border-[#E2E8F0] dark:border-slate-700">
                            {item.level || 'CEFR Level'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {item.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>Faculty:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {item.teacher?.firstName || 'Assigned'} {item.teacher?.lastName || 'Faculty'}
                          </span>
                        </p>
                      </div>

                      <Link href={`/student/learn/${item.courseId}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs font-bold h-7 border-slate-200 dark:border-slate-800 hover:border-[#006EF3] hover:text-[#006EF3] gap-1.5"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Open Classroom</span>
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                  <BookOpen className="h-6 w-6 mx-auto text-slate-300 mb-1" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">No course enrollments active</p>
                  <p>Check back once your instructor assigns you to a level syllabus.</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-slate-100 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#006EF3]" />
                Live syllabus synchronized with teacher studio
              </span>
              <Link
                href="/student/my-courses"
                className="font-bold text-[#006EF3] dark:text-blue-400 flex items-center hover:underline"
              >
                Go to My Courses <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column (4 cols): Instructor Feedback & Certificate Milestone */}
        <div className="lg:col-span-4 space-y-5">
          {/* Authentic Teacher Coaching Notes */}
          <Card className="rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#006EF3] dark:text-blue-400" />
                  <span>Instructor Notes ({feedbacks.length})</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400">
                  Faculty Feedback
                </Badge>
              </div>
              <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                Personalized notes from your assigned instructors
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {feedbacks.length > 0 ? (
                <>
                  {feedbacks.slice(0, 1).map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#012970] text-white font-bold text-[10px]">
                            {item.teacher.firstName?.[0] || 'T'}{item.teacher.lastName?.[0] || 'I'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.teacher.firstName} {item.teacher.lastName}
                            </p>
                            <p className="text-[9px] text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="indigo" className="text-[9px]">
                          {item.title || 'Feedback'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {item.content}
                      </p>

                      {item.strengths && item.strengths.length > 0 && (
                        <div className="text-[11px] text-[#006EF3] dark:text-blue-400 font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Strength: {item.strengths.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <Link href="/student/feedback" className="block mt-2">
                    <Button variant="outline" size="sm" className="w-full text-[11px] h-8 text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      View all notes ({feedbacks.length})
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3] dark:bg-slate-800 dark:text-blue-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      No Instructor Notes Yet
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      When your instructor reviews your lesson checkpoints and submissions, personalized feedback will appear here.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certificate & Milestone Progression Card */}
          <Card className="rounded-xl overflow-hidden bg-gradient-to-br from-[#011538] via-[#012970] to-[#006EF3] border border-blue-500/25 text-white shadow-md">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#F5B400]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Accredited Certification
                </span>
              </div>
              <h3 className="text-sm font-bold tracking-tight">CEFR Milestone Certificate</h3>
              <p className="text-[11px] text-blue-100/80 leading-relaxed font-normal">
                Complete your required lessons and checkpoints in your enrolled level to qualify for your official certificate.
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-blue-200">
                  <span>Level Progress</span>
                  <span className="font-bold text-white">{stats?.overallProgressPercentage ?? 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-blue-950/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#F5B400] to-amber-300 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(stats?.overallProgressPercentage ?? 0, 0))}%` }}
                  />
                </div>
              </div>

              <Link href="/student/certificates" className="block pt-2">
                <Button size="sm" className="w-full text-xs font-black shadow-xs bg-[#F5B400] hover:bg-[#d99f00] text-[#012970] gap-1.5 h-8">
                  <FileCheck className="h-3.5 w-3.5" />
                  View Certificates
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
