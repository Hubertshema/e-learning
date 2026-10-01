'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  GraduationCap,
  Play,
  Sparkles,
  Flame,
  Award,
  Layers,
  Clock,
  CheckCircle2,
  ArrowRight,
  Search,
  ChevronRight,
  BarChart3,
  Globe,
  Compass,
  Zap,
  TrendingUp,
  Bookmark
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

interface CourseItem {
  id: string;
  status: string;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  course: {
    id: string;
    title: string;
    level: string;
    description: string;
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export default function StudentLearnHub() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [primaryLevel, setPrimaryLevel] = useState('Level 1');
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await apiClient.get<any>('/student/courses');
        const data = (res as any)?.data || res;
        const enrolled = Array.isArray(data?.enrolled) ? data.enrolled : [];
        setCourses(enrolled);
        setPrimaryLevel(data?.primaryLevel || 'Level 1');
      } catch (err) {
        console.error('Failed to load courses for learning studio', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeCourses = courses.filter((c) => c.status === 'ACTIVE');
  const completedCourses = courses.filter((c) => c.status === 'COMPLETED' || c.progressPercent === 100);
  const featuredCourse = activeCourses[0] || courses[0];

  const filteredCourses = courses.filter((c) => {
    if (filterTab === 'ACTIVE' && c.status !== 'ACTIVE') return false;
    if (filterTab === 'COMPLETED' && c.status !== 'COMPLETED' && c.progressPercent < 100) return false;
    if (search && !c.course.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCompletedLessons = courses.reduce((acc, c) => acc + (c.completedLessonsCount || 0), 0);
  const totalLessons = courses.reduce((acc, c) => acc + (c.totalLessonsCount || 0), 0);
  const overallProgress = totalLessons > 0 ? Math.round((totalCompletedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F3F7FC]/50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-8 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#012970] text-white shadow-md shadow-[#012970]/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#012970] dark:text-[#006EF3]">
                English Learning Studio
              </span>
              <Badge variant="indigo" className="text-[10px] font-bold">
                CEFR {primaryLevel}
              </Badge>
            </div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">
              My Interactive Learning Classroom
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/student/my-courses">
            <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Enrolled Courses</span>
            </Button>
          </Link>
          <Link href="/student">
            <Button size="sm" variant="secondary" className="rounded-xl text-xs font-semibold">
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Main Studio Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
        {/* Hero Banner with Stats Spotlight */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#011538] via-[#012970] to-[#006EF3] p-6 sm:p-8 lg:p-10 text-white shadow-2xl">
          {/* Subtle Ambient Background Orbs */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md">
                  <Flame className="h-4 w-4 text-[#F5B400] fill-[#F5B400] animate-pulse" />
                  <span>Daily Study Streak: 5 Days</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  <Globe className="h-3.5 w-3.5 text-blue-200" />
                  <span>Interactive CEFR Framework</span>
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl text-white">
                Welcome back, {user?.firstName || 'Student'}! 👋
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-blue-100 max-w-xl">
                Ready to elevate your English fluency? Continue where you left off or choose any unit from your
                active curricula below.
              </p>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
                <div className="rounded-2xl bg-black/20 p-3 backdrop-blur-xs border border-white/10 text-center">
                  <span className="block text-lg sm:text-xl font-black">{totalCompletedLessons}</span>
                  <span className="text-[10px] sm:text-xs text-blue-200 font-medium">Lessons Done</span>
                </div>
                <div className="rounded-2xl bg-black/20 p-3 backdrop-blur-xs border border-white/10 text-center">
                  <span className="block text-lg sm:text-xl font-black">{overallProgress}%</span>
                  <span className="text-[10px] sm:text-xs text-blue-200 font-medium">Overall Progress</span>
                </div>
                <div className="rounded-2xl bg-black/20 p-3 backdrop-blur-xs border border-white/10 text-center">
                  <span className="block text-lg sm:text-xl font-black">{activeCourses.length}</span>
                  <span className="text-[10px] sm:text-xs text-blue-200 font-medium">Active Courses</span>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Spotlight Resume Card */}
            <div className="lg:col-span-5">
              {featuredCourse ? (
                <div className="rounded-3xl bg-white/95 p-6 text-slate-900 shadow-2xl backdrop-blur-md dark:bg-slate-900/95 dark:text-white border border-white/20 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#012970] dark:text-[#006EF3]">
                      <Sparkles className="h-4 w-4 text-[#012970] dark:text-[#006EF3]" />
                      Continue Where You Left Off
                    </span>
                    <Badge variant="indigo" className="text-[10px]">
                      Level {featuredCourse.course.level}
                    </Badge>
                  </div>

                  <h3 className="text-base sm:text-lg font-black line-clamp-1">
                    {featuredCourse.course.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {featuredCourse.course.description || 'Master professional conversations and real-world English skills.'}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-300">Curriculum Progress</span>
                      <span className="text-[#012970] dark:text-[#006EF3] font-black">
                        {featuredCourse.progressPercent}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full bg-[#006EF3] rounded-full transition-all duration-500"
                        style={{ width: `${featuredCourse.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {featuredCourse.completedLessonsCount} of {featuredCourse.totalLessonsCount} lessons finished
                    </span>
                  </div>

                  <Link href={`/student/learn/${featuredCourse.course.id}`} className="mt-5 block">
                    <Button variant="gradient" size="default" className="w-full rounded-2xl font-bold shadow-lg">
                      <Play className="mr-2 h-4 w-4 fill-current" />
                      Resume Interactive Classroom
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-3xl bg-white/10 p-6 text-center backdrop-blur-md border border-white/10">
                  <BookOpen className="mx-auto mb-2 h-8 w-8 text-blue-200" />
                  <p className="text-xs text-blue-100 font-medium">
                    No active course enrollments yet. Explore courses to begin!
                  </p>
                  <Link href="/student/courses" className="mt-3 inline-block">
                    <Button size="sm" variant="secondary" className="rounded-xl font-bold text-xs">
                      Explore Course Catalog
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Filter Bar & Search Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#012970] dark:text-[#006EF3]" />
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              My Learning Curricula
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {filteredCourses.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    filterTab === tab
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'In Progress' : 'Completed'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search curriculum..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-[#006EF3] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* 4. Responsive Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((item) => {
              const isFinished = item.progressPercent === 100 || item.status === 'COMPLETED';

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#006EF3]/40 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    {/* Course Card Top Banner */}
                    <div className="bg-linear-to-r from-slate-900 to-slate-800 p-5 text-white">
                      <div className="flex items-center justify-between">
                        <Badge variant="indigo" className="font-bold text-[10px] uppercase tracking-wider">
                          CEFR {item.course.level}
                        </Badge>
                        {isFinished ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-[#012970]/70 px-2.5 py-0.5 text-[11px] font-bold text-blue-200 border border-blue-400/30">
                            <Zap className="h-3 w-3 text-[#F5B400]" /> Active Studio
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-base font-black text-white line-clamp-1 group-hover:text-[#006EF3] transition-colors">
                        {item.course.title}
                      </h3>

                      {item.course.teacher?.user && (
                        <p className="mt-0.5 text-[11px] text-slate-300">
                          Instructor: {item.course.teacher.user.firstName} {item.course.teacher.user.lastName}
                        </p>
                      )}
                    </div>

                    {/* Course Card Content */}
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.course.description || 'Comprehensive 7-skill curriculum focusing on conversational fluency.'}
                      </p>

                      {/* Progress Section */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">Syllabus Completion</span>
                          <span className="text-[#012970] dark:text-[#006EF3] font-black">
                            {item.progressPercent}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full bg-[#006EF3] rounded-full transition-all duration-500"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span>{item.completedLessonsCount} / {item.totalLessonsCount} lessons</span>
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            {item.totalLessonsCount - item.completedLessonsCount} remaining
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-5 pt-0">
                    <Link href={`/student/learn/${item.course.id}`} className="block w-full">
                      <Button
                        variant={isFinished ? 'outline' : 'gradient'}
                        size="default"
                        className="w-full rounded-2xl font-bold text-xs shadow-md group-hover:shadow-lg transition-all"
                      >
                        <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                        {isFinished ? 'Review Classroom' : 'Enter Classroom'}
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
            <Compass className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No courses match your filter</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Try clearing your search query or explore new courses.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterTab('ALL');
              }}
              className="rounded-xl text-xs font-bold"
            >
              Reset Filters
            </Button>
          </Card>
        )}

        {/* 5. 7-Core Skills Mastery Highlight */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#012970] dark:text-[#006EF3]" />
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  CEFR 7-Skill Mastery Pillars
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Every lesson and interactive video automatically evaluates and strengthens your English competencies.
              </p>
            </div>
            <Link href="/student">
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold">
                <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                View Skill Analytics
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { name: 'Speaking', color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300', icon: '🗣️' },
              { name: 'Listening', color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300', icon: '🎧' },
              { name: 'Reading', color: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300', icon: '📖' },
              { name: 'Writing', color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300', icon: '✍️' },
              { name: 'Grammar', color: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300', icon: '📐' },
              { name: 'Vocabulary', color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300', icon: '📚' },
              { name: 'Pronunciation', color: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300', icon: '🎙️' },
            ].map((skill) => (
              <div
                key={skill.name}
                className={`rounded-2xl border p-3 text-center transition-all hover:scale-105 ${skill.color}`}
              >
                <span className="text-xl block mb-1">{skill.icon}</span>
                <span className="text-xs font-black block">{skill.name}</span>
                <span className="text-[10px] opacity-75 font-semibold">Active Tracker</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
