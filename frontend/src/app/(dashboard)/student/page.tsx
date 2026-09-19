'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ClipboardList,
  GraduationCap,
  Calendar,
  Flame,
  Check,
  ChevronRight,
  Zap,
  Target,
  FileCheck,
  MessageSquare,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData } from '@/lib/cache';

interface DashboardResponse {
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
    };
  };
  stats: {
    activeCoursesCount: number;
    totalEnrolledCount: number;
    completedLessonsCount: number;
    studyTimeMinutes: number;
    hasTakenPlacementTest: boolean;
    latestPlacementScore: number | null;
    recommendedLevel: string | null;
  };
  skillProgress?: Array<{
    skill: string;
    score: number;
    level: string;
  }>;
  activeEnrollments: Array<{
    id: string;
    status: string;
    expiresAt?: string;
    course: {
      id: string;
      title: string;
      level: string;
      teacher: {
        user: {
          firstName: string;
          lastName: string;
        };
      };
      units: Array<{
        id: string;
        title: string;
        lessons: Array<{
          id: string;
          title: string;
          skill: string;
          estimatedMinutes: number;
        }>;
      }>;
    };
  }>;
  recentAssignments: Array<{
    id: string;
    status: string;
    score?: number;
    submittedAt: string;
    assignment: {
      title: string;
      maxScore: number;
      lesson?: {
        unit?: {
          course?: {
            title: string;
          };
        };
      };
    };
  }>;
  recentQuizzes: Array<{
    id: string;
    score: number;
    passed: boolean;
    startedAt: string;
    quiz: {
      title: string;
      passingScore: number;
    };
  }>;
  teacherFeedbacks: Array<{
    id: string;
    title: string;
    content: string;
    strengths: string[];
    improvements: string[];
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();

  const {
    data,
    loading,
    isValidating,
    error,
    refresh,
  } = useCachedData<DashboardResponse>(
    user ? `student_dashboard_${user.id}` : null,
    async () => {
      const res = await apiClient.get<DashboardResponse>('/student/dashboard');
      return res;
    },
    {
      ttl: 60000,
      revalidateOnFocus: true,
    }
  );

  const primaryEnrollment = data?.activeEnrollments?.[0];
  const nextLesson = primaryEnrollment?.course?.units?.[0]?.lessons?.[0];

  const skillMastery = data?.skillProgress?.length
    ? data.skillProgress
    : [
        { skill: 'Grammar', score: 0, level: 'A1', color: 'bg-indigo-500' },
        { skill: 'Vocabulary', score: 0, level: 'A1', color: 'bg-indigo-500' },
        { skill: 'Reading', score: 0, level: 'A1', color: 'bg-indigo-500' },
        { skill: 'Listening', score: 0, level: 'A1', color: 'bg-indigo-500' },
        { skill: 'Writing', score: 0, level: 'A1', color: 'bg-indigo-500' },
        { skill: 'Speaking', score: 0, level: 'A1', color: 'bg-indigo-500' },
        { skill: 'Pronunciation', score: 0, level: 'A1', color: 'bg-indigo-500' },
      ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Gamified Fluency Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-primary-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-800/40">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo" className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 font-mono text-[11px] px-3 py-1">
                🌟 Student Learning Hub
              </Badge>
              {loading && !data ? (
                <Skeleton className="h-5 w-20 bg-indigo-800/60" />
              ) : (
                <Badge variant="outline" className="text-white border-white/20 text-[11px] px-2.5 py-0.5 font-bold">
                  Level {data?.profile?.currentLevel || user?.studentProfile?.currentLevel || 'A1'}
                </Badge>
              )}
              {data?.profile?.targetLevel && (
                <Badge variant="success" className="text-[11px] px-2.5 py-0.5 font-bold">
                  🎯 Target: {data.profile.targetLevel}
                </Badge>
              )}
              {isValidating && (
                <span className="flex items-center gap-1 text-[11px] text-indigo-300">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Syncing...
                </span>
              )}
            </div>

            {loading && !data ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-72 bg-indigo-800/60" />
                <Skeleton className="h-4 w-full bg-indigo-800/60" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Welcome back, {user?.firstName || 'Student'}!
                </h1>
                <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                  Continue your CEFR English curriculum, submit homework assignments, and practice your 7 language skills.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <Link href="/student/courses">
              <Button variant="outline" size="sm" className="border-indigo-400/40 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800/60 backdrop-blur-md">
                <BookOpen className="mr-1.5 h-3.5 w-3.5 text-indigo-300" />
                Browse Courses
              </Button>
            </Link>
            <Link href="/student/placement-test">
              <Button variant="gradient" size="sm" className="shadow-lg shadow-indigo-600/40 font-bold">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Placement Test
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Study Progress Strip */}
        <div className="mt-6 pt-5 border-t border-indigo-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {loading && !data ? (
            <>
              <Skeleton className="h-4 w-full bg-indigo-800/50" />
              <Skeleton className="h-4 w-full bg-indigo-800/50" />
              <Skeleton className="h-4 w-full bg-indigo-800/50" />
              <Skeleton className="h-4 w-full bg-indigo-800/50" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-indigo-200">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Courses: <strong>{data?.stats?.activeCoursesCount ?? 0}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-indigo-200">
                <div className="h-2 w-2 rounded-full bg-primary-400" />
                <span>Lessons Finished: <strong>{data?.stats?.completedLessonsCount ?? 0}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-indigo-200">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Study Time: <strong>{data?.stats?.studyTimeMinutes ?? 0} min</strong></span>
              </div>
              <div className="flex items-center gap-2 text-indigo-200">
                <div className="h-2 w-2 rounded-full bg-rose-400" />
                <span>Diagnostic Test: <strong>{data?.stats?.hasTakenPlacementTest ? 'Completed' : 'Pending'}</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading && !data ? (
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
          [
            {
              label: 'Active Enrollments',
              value: data?.stats?.activeCoursesCount ?? 0,
              sub: 'Curriculum tracks unlocked',
              icon: BookOpen,
              href: '/student/my-courses',
              color: 'text-indigo-600',
              bg: 'bg-indigo-50 dark:bg-indigo-950/60',
            },
            {
              label: 'Completed Lessons',
              value: data?.stats?.completedLessonsCount ?? 0,
              sub: 'Interactive modules finished',
              icon: CheckCircle2,
              href: '/student/progress',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50 dark:bg-emerald-950/60',
            },
            {
              label: 'Quizzes Taken',
              value: data?.recentQuizzes?.length ?? 0,
              sub: 'Evaluations completed',
              icon: Award,
              href: '/student/quizzes',
              color: 'text-amber-600',
              bg: 'bg-amber-50 dark:bg-amber-950/60',
            },
            {
              label: 'Study Minutes',
              value: `${data?.stats?.studyTimeMinutes ?? 0}m`,
              sub: 'Total immersion time',
              icon: Clock,
              href: '/student/progress',
              color: 'text-primary-600',
              bg: 'bg-primary-50 dark:bg-primary-950/60',
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} href={m.href}>
                <Card className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {m.label}
                    </span>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.bg} ${m.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {m.value}
                      </span>
                      <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 flex items-center">
                        View <ChevronRight className="h-3 w-3 ml-0.5" />
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
        {/* Left Column (8 cols): Primary Course & Recent Work */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Course Card */}
          <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary-600" /> Continue Learning
                </CardTitle>
                <CardDescription className="text-xs">Your current syllabus pathway</CardDescription>
              </div>
              <Link href="/student/my-courses">
                <Button variant="ghost" size="sm" className="text-xs text-primary-600">
                  All Courses
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-5">
              {loading && !data ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : primaryEnrollment ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {primaryEnrollment.course.title}
                        </h3>
                        <Badge variant="indigo" className="text-[10px] py-0">
                          {primaryEnrollment.course.level}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Instructor:{' '}
                        <strong>
                          {primaryEnrollment.course.teacher?.user?.firstName}{' '}
                          {primaryEnrollment.course.teacher?.user?.lastName}
                        </strong>
                      </p>
                    </div>

                    <Link href={`/student/learn/${primaryEnrollment.course.id}`}>
                      <Button size="sm" className="gap-1.5 text-xs font-semibold">
                        <Play className="h-3.5 w-3.5 fill-current" /> Resume Course
                      </Button>
                    </Link>
                  </div>

                  {nextLesson && (
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                          <Play className="h-4 w-4 fill-current" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{nextLesson.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {nextLesson.skill} • {nextLesson.estimatedMinutes} mins
                          </p>
                        </div>
                      </div>

                      <Link href={`/student/learn/${primaryEnrollment.course.id}?lesson=${nextLesson.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Start
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Not Enrolled in Any Courses Yet</p>
                  <p className="text-[11px] text-slate-500">Explore the CEFR catalog and start your English journey.</p>
                  <Link href="/student/courses" className="inline-block">
                    <Button size="sm" className="text-xs">
                      Explore Courses
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/student/assignments" className="group">
              <Card className="p-4 rounded-2xl transition-all hover:border-primary-500 hover:shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      Assignments
                    </h3>
                    <p className="text-[10px] text-slate-500">Submit homework</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/student/quizzes" className="group">
              <Card className="p-4 rounded-2xl transition-all hover:border-primary-500 hover:shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      Quizzes & Tests
                    </h3>
                    <p className="text-[10px] text-slate-500">Test comprehension</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/student/feedback" className="group">
              <Card className="p-4 rounded-2xl transition-all hover:border-primary-500 hover:shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      Instructor Notes
                    </h3>
                    <p className="text-[10px] text-slate-500">Teacher feedback</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Column (4 cols): 7-Skill CEFR Framework Matrix */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">7-Skill Fluency Matrix</h3>
              </div>
              <Link href="/student/progress" className="text-xs font-semibold text-primary-600 hover:underline">
                Details
              </Link>
            </div>

            {loading && !data ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {skillMastery.map((s) => (
                  <div key={s.skill} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{s.skill}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{s.score}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, s.score))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
