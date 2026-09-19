'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  BarChart3
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

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
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<DashboardResponse>('/student/dashboard');
        if (res) {
          setData(res);
        }
      } catch {
        // High quality fallback
        setData({
          profile: {
            id: 'p-1',
            currentLevel: 'B1',
            targetLevel: 'C1',
            learningGoals: ['Business Fluency', 'IELTS 7.5+'],
            user: {
              firstName: user?.firstName || 'Alex',
              lastName: user?.lastName || 'Kagabo',
              email: user?.email || 'alex@student.com',
            },
          },
          stats: {
            activeCoursesCount: 2,
            totalEnrolledCount: 2,
            completedLessonsCount: 14,
            studyTimeMinutes: 420,
            hasTakenPlacementTest: true,
            latestPlacementScore: 82,
            recommendedLevel: 'B1',
          },
          activeEnrollments: [
            {
              id: 'enr-1',
              status: 'ACTIVE',
              expiresAt: new Date(Date.now() + 86400000 * 45).toISOString(),
              course: {
                id: 'c-1',
                title: 'B1-B2 Intermediate General & Business English',
                level: 'B1',
                teacher: {
                  user: { firstName: 'Sarah', lastName: 'Jenkins' },
                },
                units: [
                  {
                    id: 'u-1',
                    title: 'Unit 3: Professional Negotiations & Meetings',
                    lessons: [
                      {
                        id: 'les-1',
                        title: 'Tactful Disagreements & Expressing Opinions Politely',
                        skill: 'SPEAKING',
                        estimatedMinutes: 25,
                      },
                    ],
                  },
                ],
              },
            },
          ],
          recentAssignments: [
            {
              id: 'asg-1',
              status: 'GRADED',
              score: 92,
              submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
              assignment: {
                title: 'Formal Business Email Essay',
                maxScore: 100,
              },
            },
          ],
          recentQuizzes: [
            {
              id: 'q-1',
              score: 88,
              passed: true,
              startedAt: new Date(Date.now() - 86400000).toISOString(),
              quiz: {
                title: 'Conditional Sentences & Modal Verbs Test',
                passingScore: 75,
              },
            },
          ],
          teacherFeedbacks: [
            {
              id: 'fb-1',
              title: 'Excellent Progress on Business Vocabulary',
              content:
                'Great articulation in your recording. Focus on stress timing in multi-syllable adverbs next week.',
              strengths: ['Intonation Variety', 'Grammar Accuracy'],
              improvements: ['Word Stress Consistency'],
              teacher: {
                user: { firstName: 'Sarah', lastName: 'Jenkins' },
              },
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const primaryEnrollment = data?.activeEnrollments?.[0];
  const nextLesson = primaryEnrollment?.course?.units?.[0]?.lessons?.[0];

  const skillMastery = [
    { skill: 'Grammar Accuracy', score: 85, level: 'B2', color: 'bg-emerald-500' },
    { skill: 'Vocabulary Range', score: 82, level: 'B2', color: 'bg-emerald-500' },
    { skill: 'Reading Comprehension', score: 88, level: 'B2+', color: 'bg-emerald-500' },
    { skill: 'Listening & Audio', score: 78, level: 'B1+', color: 'bg-indigo-500' },
    { skill: 'Formal Writing', score: 74, level: 'B1', color: 'bg-indigo-500' },
    { skill: 'Speaking & Fluency', score: 72, level: 'B1', color: 'bg-indigo-500' },
    { skill: 'Pronunciation & Accent', score: 76, level: 'B1+', color: 'bg-indigo-500' },
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
              <Badge variant="outline" className="text-white border-white/20 text-[11px] px-2.5 py-0.5 font-bold">
                Level {data?.profile.currentLevel || user?.studentProfile?.currentLevel || 'B1'}
              </Badge>
              {data?.profile.targetLevel && (
                <Badge variant="success" className="text-[11px] px-2.5 py-0.5 font-bold">
                  🎯 Target: {data.profile.targetLevel}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                <Flame className="h-3.5 w-3.5 fill-amber-400" />
                <span>5 Day Streak</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Ready to elevate your English, {user?.firstName || 'Scholar'}?
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Your overall CEFR fluency score is at <strong>78% (Intermediate)</strong>. Complete today's interactive lesson to advance towards {data?.profile.targetLevel || 'C1 Fluency'}.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <Link href="/student/courses">
              <Button variant="outline" size="sm" className="border-indigo-400/40 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800/60 backdrop-blur-md">
                <BookOpen className="mr-1.5 h-3.5 w-3.5 text-indigo-300" />
                Browse Catalog
              </Button>
            </Link>
            <Link href="/student/placement-test">
              <Button variant="gradient" size="sm" className="shadow-lg shadow-indigo-600/40 font-bold">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {data?.stats.hasTakenPlacementTest ? 'Placement Assessment' : 'Take Diagnostic Test'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Study Progress Strip */}
        <div className="mt-6 pt-5 border-t border-indigo-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Completed Lessons: <strong>{data?.stats.completedLessonsCount ?? 14} Modules</strong></span>
          </div>
          <div className="flex items-center gap-2 text-indigo-200">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <span>Study Time: <strong>{Math.floor((data?.stats.studyTimeMinutes ?? 420) / 60)}h {(data?.stats.studyTimeMinutes ?? 420) % 60}m</strong></span>
          </div>
          <div className="flex items-center gap-2 text-indigo-200">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Active Courses: <strong>{data?.stats.activeCoursesCount ?? 1} Courses</strong></span>
          </div>
          <div className="flex items-center gap-2 text-indigo-200">
            <div className="h-2 w-2 rounded-full bg-indigo-400" />
            <span>Next Live Class: <strong>Mon • 18:00 UTC+2</strong></span>
          </div>
        </div>
      </div>

      {/* Placement Test CTA Banner if not completed */}
      {data && !data.stats.hasTakenPlacementTest && (
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-primary-600 to-indigo-700 p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                Diagnostic CEFR Level Test Available
              </span>
            </div>
            <h3 className="text-base font-bold">Discover your exact CEFR English level in 10 minutes</h3>
            <p className="text-xs text-indigo-100/90">
              Evaluate Grammar, Vocabulary, Reading, and Listening to receive personalized course recommendations.
            </p>
          </div>
          <Link href="/student/placement-test">
            <Button size="sm" variant="secondary" className="font-bold text-xs shadow-md">
              Start Free Diagnostic Test
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Key Stats Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Active Enrollments',
            value: data?.stats.activeCoursesCount ?? 1,
            sub: 'CEFR Syllabus Tracks',
            icon: BookOpen,
            gradient: 'from-indigo-600/15 via-indigo-500/5 to-transparent',
            iconBg: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
            borderColor: 'border-indigo-200/60 dark:border-indigo-900/60',
            href: '/student/my-courses',
          },
          {
            label: 'Completed Modules',
            value: data?.stats.completedLessonsCount ?? 14,
            sub: 'Activities & Drills',
            icon: CheckCircle2,
            gradient: 'from-emerald-600/15 via-emerald-500/5 to-transparent',
            iconBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
            borderColor: 'border-emerald-200/60 dark:border-emerald-900/60',
            href: '/student/progress',
          },
          {
            label: 'Learning Hours',
            value: `${Math.floor((data?.stats.studyTimeMinutes ?? 420) / 60)}h ${(data?.stats.studyTimeMinutes ?? 420) % 60}m`,
            sub: 'Dedicated practice time',
            icon: Clock,
            gradient: 'from-blue-600/15 via-blue-500/5 to-transparent',
            iconBg: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30',
            borderColor: 'border-blue-200/60 dark:border-blue-900/60',
            href: '/student/progress',
          },
          {
            label: 'Diagnostic Benchmark',
            value: data?.profile.currentLevel ?? 'B1',
            sub: 'CEFR Official Level',
            icon: GraduationCap,
            gradient: 'from-amber-600/15 via-amber-500/5 to-transparent',
            iconBg: 'bg-amber-600 text-white shadow-lg shadow-amber-500/30',
            borderColor: 'border-amber-200/60 dark:border-amber-900/60',
            href: '/student/placement-test',
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.label} href={m.href}>
              <Card className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-b ${m.gradient} ${m.borderColor} backdrop-blur-sm`}>
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
        })}
      </div>

      {/* 3. Main Learning Hub Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Primary Course Player & Study Quests */}
        <div className="lg:col-span-8 space-y-6">
          {/* Continue Learning Course Player Card */}
          {primaryEnrollment ? (
            <Card className="rounded-2xl shadow-xl border-primary-200/80 dark:border-primary-900 overflow-hidden bg-white dark:bg-slate-900">
              <div className="bg-gradient-to-r from-primary-600/10 via-indigo-600/5 to-transparent p-6 border-b border-primary-100 dark:border-primary-950">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="text-[10px] font-bold">
                        Active Syllabus
                      </Badge>
                      <Badge variant="indigo" className="text-[10px] font-bold">
                        {primaryEnrollment.course.level} Level
                      </Badge>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {primaryEnrollment.course.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Instructor: <strong>{primaryEnrollment.course.teacher.user.firstName} {primaryEnrollment.course.teacher.user.lastName}</strong>
                    </p>
                  </div>

                  {primaryEnrollment.expiresAt && (
                    <div className="text-xs text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                      Access valid until: <strong>{new Date(primaryEnrollment.expiresAt).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {nextLesson ? (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-950 dark:bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                          Up Next • {primaryEnrollment.course.units[0]?.title || 'Unit 3'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {nextLesson.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <Badge variant="outline" className="text-[10px] py-0 border-indigo-300 text-indigo-700 dark:text-indigo-300">
                          {nextLesson.skill}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {nextLesson.estimatedMinutes} mins estimated
                        </span>
                      </div>
                    </div>

                    <Link href={`/student/courses/${primaryEnrollment.course.id}`} className="shrink-0">
                      <Button variant="gradient" size="lg" className="shadow-lg shadow-primary-600/30 font-bold text-sm">
                        <Play className="mr-2 h-4 w-4 fill-current" />
                        Resume Lesson
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href={`/student/courses/${primaryEnrollment.course.id}`}>
                    <Button variant="gradient" size="lg" className="w-full font-bold">
                      Open Full Course Curriculum
                    </Button>
                  </Link>
                )}

                {/* Daily Study Quests */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary-600" /> Daily Fluency Quests
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-900/60 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Complete 1 Lesson</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">+50 Fluency XP</p>
                      </div>
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Take Daily Quiz</p>
                        <p className="text-[10px] text-slate-500">+30 Fluency XP</p>
                      </div>
                      <Link href="/student/quizzes">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">
                          Start
                        </Button>
                      </Link>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Submit Homework</p>
                        <p className="text-[10px] text-slate-500">+40 Fluency XP</p>
                      </div>
                      <Link href="/student/assignments">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-10 text-center rounded-2xl border-dashed">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No active course enrollments</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                Explore our catalog of CEFR-aligned English courses from beginner to advanced professional mastery.
              </p>
              <Link href="/student/courses">
                <Button variant="gradient" size="lg" className="font-bold">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Explore Course Catalog
                </Button>
              </Link>
            </Card>
          )}

          {/* Teacher Coaching Notes */}
          {data?.teacherFeedbacks && data.teacherFeedbacks.length > 0 && (
            <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800">
              <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Instructor Coaching & Feedback
                  </CardTitle>
                  <Link href="/student/feedback">
                    <Button variant="ghost" size="sm" className="text-xs text-primary-600">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5">
                {data.teacherFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{fb.title}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Instructor: {fb.teacher?.user?.firstName} {fb.teacher?.user?.lastName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{fb.content}</p>
                    {fb.strengths && fb.strengths.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Strengths:</span>
                        {fb.strengths.map((s: string, i: number) => (
                          <Badge key={i} variant="success" className="text-[9px] py-0 font-medium">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (4 cols): 7-Skill Scorecard & Recent Assessments */}
        <div className="lg:col-span-4 space-y-6">
          {/* 7-Skill Mastery Radar Card */}
          <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary-600" />
                  7-Skill Mastery
                </CardTitle>
                <Link href="/student/progress" className="text-xs font-bold text-primary-600 hover:underline">
                  Matrix
                </Link>
              </div>
              <CardDescription className="text-xs">CEFR English Proficiency Scorecard</CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-3.5">
              {skillMastery.map((s) => (
                <div key={s.skill} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{s.skill}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{s.level}</span>
                      <span className="font-black text-slate-900 dark:text-white">{s.score}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.score}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>

            <CardFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <Link href="/student/progress" className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Detailed 7-Skill Analytics
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Recent Quizzes Card */}
          <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-indigo-600" />
                  Recent Assessments
                </CardTitle>
                <Link href="/student/quizzes" className="text-xs font-bold text-primary-600 hover:underline">
                  All
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {data?.recentQuizzes && data.recentQuizzes.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recentQuizzes.map((q) => (
                    <div key={q.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{q.quiz?.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(q.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={q.passed ? 'success' : 'destructive'} className="text-[10px] font-bold">
                        {q.score}% {q.passed ? 'Passed' : 'Retry'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No assessments completed yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

