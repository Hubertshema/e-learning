'use client';

import React, { useState } from 'react';
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
  Sparkles,
  RefreshCw,
  FolderTree,
  MessageSquare,
  GraduationCap,
  ShieldCheck,
  Award,
  PlayCircle,
  Flame,
  TrendingUp,
  Compass,
  ChevronRight,
  Star,
  Users,
  Calendar,
  Layers,
  ChevronDown,
  Check,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData } from '@/lib/cache';
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
    activityDots: boolean[];
    goalDistance: number;
    learnTracking: {
      month: number;
      week: number;
      day: number;
    };
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
  }>;
  studyStatistics: Array<{
    day: string;
    activeHours: number;
    goalHours: number;
    inactiveHours: number;
  }>;
  skillProficiency?: Array<{
    skill: string;
    score: number;
    level?: string;
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
  topMentors: Array<{
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
    courseCount: number;
  }>;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'FEEDBACK' | 'VELOCITY' | 'HABITS'>('FEEDBACK');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(3); // Wednesday active

  // Dynamic time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Stale-While-Revalidate caching for instant responsiveness
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
  const currentLevel = dashboardData?.profile?.currentLevel || 'A2 Elementary';
  const targetLevel = dashboardData?.profile?.targetLevel || 'B2 Upper-Intermediate';
  const stats = dashboardData?.stats;
  const inProgress = dashboardData?.inProgressCourse;
  const studyStats = dashboardData?.studyStatistics || [
    { day: 'Mon', activeHours: 1.5, goalHours: 2.0, inactiveHours: 0.5 },
    { day: 'Tue', activeHours: 2.0, goalHours: 2.0, inactiveHours: 0 },
    { day: 'Wed', activeHours: 2.8, goalHours: 2.0, inactiveHours: 0 },
    { day: 'Thu', activeHours: 1.6, goalHours: 2.0, inactiveHours: 0.4 },
    { day: 'Fri', activeHours: 2.4, goalHours: 2.0, inactiveHours: 0 },
    { day: 'Sat', activeHours: 1.0, goalHours: 2.0, inactiveHours: 1.0 },
    { day: 'Sun', activeHours: 1.4, goalHours: 2.0, inactiveHours: 0.6 },
  ];
  const activityDots = stats?.activityDots || [
    true, true, false, true, true, true, false,
    true, false, true, true, true, true, true,
    true, true, true, false, true, true, true
  ];
  const mentors = dashboardData?.topMentors || [];
  const feedbacks = dashboardData?.feedbacks || [];
  const skillProficiency = dashboardData?.skillProficiency || [
    { skill: 'Grammar', score: 78 },
    { skill: 'Vocabulary', score: 85 },
    { skill: 'Reading', score: 82 },
    { skill: 'Listening', score: 74 },
    { skill: 'Writing', score: 70 },
    { skill: 'Speaking', score: 68 },
    { skill: 'Pronunciation', score: 72 },
  ];

  // 4 KPI Metrics definition mirroring executive teacher styling
  const studentMetrics = [
    {
      label: 'Primary Curriculum',
      value: stats?.activeCoursesCount ?? 1,
      sub: `${currentLevel} enrolled courses`,
      badge: currentLevel,
      icon: BookOpen,
      iconBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25',
      borderColor: 'border-emerald-200/80 dark:border-emerald-900/60',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      href: '/student/my-courses',
    },
    {
      label: 'Study Velocity',
      value: `${stats?.streakDays ?? 5}d`,
      sub: stats?.totalActivityHoursText || '4 hours 15 minutes',
      badge: 'Active Streak',
      icon: Flame,
      iconBg: 'bg-amber-600 text-white shadow-lg shadow-amber-600/25',
      borderColor: 'border-amber-200/80 dark:border-amber-900/60',
      badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold',
      highlight: true,
      href: '/student/progress',
    },
    {
      label: 'Completed Modules',
      value: stats?.completedLessonsCount ?? 3,
      sub: `${stats?.overallProgressPercentage ?? 25}% syllabus completed`,
      badge: `${stats?.growthPercentage ?? 14}% Growth`,
      icon: CheckCircle2,
      iconBg: 'bg-blue-600 text-white shadow-lg shadow-blue-600/25',
      borderColor: 'border-blue-200/80 dark:border-blue-900/60',
      badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      href: '/student/my-courses',
    },
    {
      label: 'CEFR Mastery Target',
      value: targetLevel.split(' ')[0] || 'B2',
      sub: `${stats?.goalDistance ?? 75}% to milestone certification`,
      badge: 'Goal Distance',
      icon: Award,
      iconBg: 'bg-purple-600 text-white shadow-lg shadow-purple-600/25',
      borderColor: 'border-purple-200/80 dark:border-purple-900/60',
      badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold',
      href: '/student/my-courses',
    },
  ];

  // ─── ADMISSION & PAYMENT GATING ───────────────────────────────────────────
  // If the student's learning access is locked (application pending/rejected, or payment required)
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ─── 1. Student Executive Command Hero ────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#112314] via-[#1a3820] to-[#0e1d11] p-6 sm:p-8 text-white shadow-2xl border border-emerald-500/25">
        {/* Ambient Glowing Mesh Orbs */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Learner Status Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                CEFR Interactive Learning Hub
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="h-3.5 w-3.5" /> {currentLevel} Verified
              </span>

              {isValidating && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-200/70">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Syncing syllabus...
                </span>
              )}
            </div>

            {/* Time-aware Greeting */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {getGreeting()}, {studentFirstName}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              Pick up right where you left off, review personalized instructor coaching notes, track your 7-skill CEFR mastery, and explore upcoming lessons.
            </p>
          </div>

          {/* Quick Action Speed-Dial */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={isValidating}
              title="Refresh live learning dashboard"
              className="border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 backdrop-blur-md h-9"
            >
              <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            </Button>

            <Link href="/student/my-courses">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-lg shadow-emerald-700/30 gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                My Learning
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Learning Summary Strip */}
        <div className="mt-6 pt-5 border-t border-emerald-800/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {loading && !dashboardData ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full bg-emerald-950/60" />
            ))
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Courses: <strong>{stats?.activeCoursesCount ?? 1} Assigned</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Study Streak: <strong>{stats?.streakDays ?? 5} Consecutive Days</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className="h-2 w-2 rounded-full bg-teal-400" />
                <span>Modules: <strong>{stats?.completedLessonsCount ?? 3} Lessons Mastered</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <div className="h-2 w-2 rounded-full bg-sky-400" />
                <span>Milestone: <strong>{stats?.overallProgressPercentage ?? 25}% to {targetLevel.split(' ')[0]}</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Network Error Toast */}
      {error && !dashboardData && (
        <div className="flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-md bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Could not connect to live student service. Please check your connection.</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refresh()} className="h-7 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* ─── 2. Key Metrics Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading && !dashboardData ? (
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
          studentMetrics.map((m) => {
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
        {/* Left Column (8 cols): In-Progress Course & Student Action Center */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Current In-Progress Course with Next Lesson 1-Click Resume */}
          <Card className="rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#315b36] dark:bg-emerald-950/60 dark:text-emerald-400">
                    <PlayCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      Current Learning Curriculum
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        In Progress
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      {inProgress?.course?.title || 'Everyday Fluency & Workplace English'}
                    </CardDescription>
                  </div>
                </div>

                <Link href="/student/my-courses">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-slate-200 dark:border-slate-800 gap-1">
                    <span>All Courses</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Course Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Course Syllabus Mastery
                  </span>
                  <span className="font-bold text-[#315b36] dark:text-emerald-400">
                    {inProgress?.progressPercentage ?? 25}% Complete ({inProgress?.completedLessonsCount ?? 1} of {inProgress?.totalLessonsCount ?? 4} lessons)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-[#315b36] transition-all duration-700"
                    style={{ width: `${inProgress?.progressPercentage ?? 25}%` }}
                  />
                </div>
              </div>

              {/* Next Lesson Box with Prominent 1-Click Launch */}
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 p-5 dark:border-emerald-900/50 dark:bg-slate-900/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                        Next Up
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {inProgress?.nextLesson?.durationMinutes ?? 15} mins
                      </span>
                      {inProgress?.nextLesson?.skill && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {inProgress.nextLesson.skill}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {inProgress?.nextLesson?.title || 'Interactive Lesson: Everyday Fluency & Contextual Dialogue'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Instructor: <strong className="text-slate-800 dark:text-slate-200">
                        {inProgress?.course?.teacher?.user?.firstName || 'International'} {inProgress?.course?.teacher?.user?.lastName || 'Faculty'}
                      </strong> • CEFR Accredited
                    </p>
                  </div>

                  <Link
                    href={
                      inProgress?.nextLesson?.id
                        ? `/student/interactive-video?lessonId=${inProgress.nextLesson.id}`
                        : `/student/my-courses`
                    }
                  >
                    <Button
                      size="default"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 h-10 shadow-lg shadow-emerald-700/25 shrink-0 gap-2 w-full sm:w-auto"
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>Resume Lesson</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Center with Segmented 3-Tab Control */}
          <Card className="rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#315b36] dark:text-emerald-400" />
                    Student Learning &amp; Activity Hub
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Instructor coaching guidance, study velocity charts, and daily habits
                  </CardDescription>
                </div>

                {/* Segmented 3-Tab Control */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    onClick={() => setActiveTab('FEEDBACK')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      activeTab === 'FEEDBACK'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Faculty Notes ({feedbacks.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('VELOCITY')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      activeTab === 'VELOCITY'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Study Hours</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('HABITS')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      activeTab === 'HABITS'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>Habit Matrix</span>
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {activeTab === 'FEEDBACK' ? (
                /* Tab 1: Faculty Coaching Notes */
                feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    {feedbacks.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-emerald-300 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm overflow-hidden">
                              {item.teacher.avatarUrl ? (
                                <img
                                  src={item.teacher.avatarUrl}
                                  alt={item.teacher.firstName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                `${item.teacher.firstName[0] || 'T'}${item.teacher.lastName[0] || 'I'}`
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {item.teacher.firstName} {item.teacher.lastName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Certified CEFR Faculty • {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="indigo" className="w-fit text-[10px]">
                            {item.title || 'Instructional Feedback'}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                          {item.content}
                        </p>

                        {(item.strengths.length > 0 || item.improvements.length > 0) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                            {item.strengths.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Strengths:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {item.strengths.map((s, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {item.improvements.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" /> Focus Areas:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {item.improvements.map((imp, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-semibold border border-amber-200 dark:border-amber-800">
                                      {imp}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#315b36] dark:bg-emerald-950/60 dark:text-emerald-400">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No Instructor Notes Yet
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        As you submit exercises and engage in coursework, your assigned teachers will post personalized coaching feedback here.
                      </p>
                    </div>
                  </div>
                )
              ) : activeTab === 'VELOCITY' ? (
                /* Tab 2: Study Velocity 7-Day Chart */
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Daily active hours vs. 2.0h CEFR target</span>
                    <span className="font-bold text-[#315b36] dark:text-emerald-400">Weekly Total: {stats?.studyTimeHours ?? 4}h</span>
                  </div>

                  <div className="relative pt-6 pb-2">
                    {/* Y-axis guidelines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] font-bold text-slate-300 dark:text-slate-700">
                      <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full flex justify-between">
                        <span>4h</span>
                      </div>
                      <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full flex justify-between">
                        <span>3h</span>
                      </div>
                      <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full flex justify-between">
                        <span>2h (Target)</span>
                      </div>
                      <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full flex justify-between">
                        <span>1h</span>
                      </div>
                      <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full flex justify-between">
                        <span>0h</span>
                      </div>
                    </div>

                    {/* 7 Days Bar Columns */}
                    <div className="relative z-10 grid grid-cols-7 gap-2 sm:gap-4 h-48 items-end pl-8 pr-2">
                      {studyStats.map((item, index) => {
                        const activeHeightPercent = Math.min(100, Math.round((item.activeHours / 4) * 100));
                        const isHovered = hoveredBarIndex === index;

                        return (
                          <div
                            key={item.day}
                            className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                            onMouseEnter={() => setHoveredBarIndex(index)}
                          >
                            {/* Hover Tooltip Popup */}
                            {isHovered && (
                              <div className="absolute -top-11 z-30 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 shadow-xl text-[11px] font-bold whitespace-nowrap animate-in fade-in zoom-in-95">
                                <p>Active: {item.activeHours}h</p>
                                <p className="text-slate-300 dark:text-slate-600 text-[10px]">Target: {item.goalHours}h</p>
                              </div>
                            )}

                            {/* Bar Track & Fill */}
                            <div className="w-full max-w-[36px] h-full rounded-t-lg bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex flex-col justify-end relative">
                              <div
                                className={`w-full rounded-t-lg transition-all duration-300 ${
                                  isHovered ? 'bg-[#254629] dark:bg-emerald-400' : 'bg-emerald-600 dark:bg-emerald-500'
                                }`}
                                style={{
                                  height: `${activeHeightPercent}%`,
                                  backgroundImage:
                                    'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)',
                                }}
                              />
                            </div>

                            {/* Day Label */}
                            <span
                              className={`text-xs font-bold mt-2.5 transition-colors ${
                                isHovered ? 'text-[#315b36] dark:text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              {item.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart Legend */}
                  <div className="flex items-center justify-center gap-6 pt-2 text-xs font-bold text-slate-500 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-600" />
                      <span>Logged Practice Hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <span>CEFR Daily Target</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 3: Habit Matrix (21 Days) */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {stats?.streakDays ?? 5} Days Study Streak
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Consistency is the most effective driver for CEFR fluency advancement.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-[#315b36] dark:text-emerald-400">
                        {stats?.streakDays ? `${Math.round((stats.streakDays / 21) * 100)}%` : '85%'}
                      </span>
                      <p className="text-[11px] text-slate-400">Consistency Index</p>
                    </div>
                  </div>

                  {/* 3 rows of 7 activity dots */}
                  <div className="space-y-3 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 block mb-2">
                      Past 21 Days Study Session Log:
                    </span>
                    <div className="grid grid-cols-7 gap-3">
                      {activityDots.map((active, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                          <span
                            className={`h-4 w-4 rounded-full transition-transform hover:scale-125 ${
                              active
                                ? 'bg-emerald-600 dark:bg-emerald-400 shadow-md shadow-emerald-600/30'
                                : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          />
                          <span className="text-[10px] text-slate-400 font-medium">d{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live curriculum progress tracking
              </span>
              <Link
                href="/student/my-courses"
                className="font-bold text-[#315b36] dark:text-emerald-400 flex items-center hover:underline"
              >
                View Enrolled Course Modules <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column (4 cols): 7-Skill CEFR Matrix, Levels & Mentors */}
        <div className="lg:col-span-4 space-y-6">
          {/* 7-Skill English Proficiency Matrix Banner mirroring Teacher styling */}
          <Card className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#122416] via-[#1a3820] to-[#0e1d11] border border-emerald-500/25 text-white shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  7-Skill CEFR Framework
                </span>
              </div>
              <h3 className="text-base font-bold tracking-tight">Your Diagnostic Proficiency</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed font-normal">
                Live performance aggregated across Grammar, Vocabulary, Reading, Listening, Writing, Speaking, and Pronunciation.
              </p>

              {/* Skill Bars */}
              <div className="space-y-3 pt-1">
                {skillProficiency.slice(0, 5).map((s) => (
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

              <Link href="/student/my-courses" className="block pt-2">
                <Button size="sm" className="w-full text-xs font-bold shadow-md bg-emerald-500 hover:bg-emerald-400 text-slate-950">
                  Continue Active Courses
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Assigned CEFR Learning Levels Card */}
          <Card className="rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-[#315b36] dark:text-emerald-400" />
                  Learning Levels
                </CardTitle>
                <Link href="/student/my-courses">
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-[#315b36] dark:text-emerald-400 h-7 px-2">
                    My Courses
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              {[
                { id: '1', name: 'Level 1: Fundamentals (A1-A2)', tag: 'Beginner', isCurrent: currentLevel.includes('A1') || currentLevel.includes('A2') },
                { id: '2', name: 'Level 2: Intermediate (B1-B2)', tag: 'Intermediate', isCurrent: currentLevel.includes('B1') || currentLevel.includes('B2') },
                { id: '3', name: 'Level 3: Advanced Mastery (C1)', tag: 'Advanced', isCurrent: currentLevel.includes('C1') }
              ].map((level) => (
                <div
                  key={level.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    level.isCurrent
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{level.name}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-[#315b36] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                      {level.isCurrent ? 'Enrolled' : level.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                    <BookOpen className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>CEFR Structured Syllabus</span>
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Mentors / Faculty Instructors */}
          <Card className="rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#315b36] dark:text-emerald-400" />
                  Assigned Faculty
                </CardTitle>
                <Link href="/student/my-courses">
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-[#315b36] dark:text-emerald-400 h-7 px-2">
                    My Courses
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              {mentors.length > 0 ? (
                mentors.slice(0, 3).map((mentor) => (
                  <div key={mentor.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#315b36] dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                        {mentor.avatarUrl ? (
                          <img src={mentor.avatarUrl} alt={mentor.name} className="h-full w-full object-cover" />
                        ) : (
                          mentor.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{mentor.name}</p>
                        <p className="text-[10px] text-slate-500">{mentor.role}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
                      Faculty
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  <Users className="h-6 w-6 mx-auto text-slate-300 mb-1" />
                  <span>Faculty mentors will appear as you enroll in courses.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
