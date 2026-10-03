'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Layers,
  FileCheck
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { CardGridSkeleton } from '@/components/ui/card-grid-skeleton';
import { useCachedData } from '@/lib/cache';

interface EnrolledCourseItem {
  id: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'EXPIRED' | 'COMPLETED';
  enrolledAt: string;
  expiresAt?: string;
  isExpired: boolean;
  daysRemaining: number | null;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  isCompleted?: boolean;
  hasCertificate?: boolean;
  course: {
    id: string;
    title: string;
    level: string;
    description: string;
    price: number;
    currency: string;
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export default function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');

  const { data: fetchResult, loading } = useCachedData<{ enrolled: EnrolledCourseItem[], primaryLevel: string }>(
    'student_my_courses',
    async () => {
      const res = await apiClient.get<any>('/student/courses');
      const data = (res as any)?.data || res;
      return {
        enrolled: Array.isArray(data?.enrolled) ? data.enrolled : [],
        primaryLevel: data?.primaryLevel || 'Level 1'
      };
    },
    { ttl: 120_000, initialData: { enrolled: [], primaryLevel: 'Level 1' } }
  );

  const courses = fetchResult?.enrolled || [];
  const primaryLevel = fetchResult?.primaryLevel || 'Level 1';

  // Deduplicate enrolled courses to prevent duplicates from multiple level assignments
  const seenEnrollmentCourseIds = new Set<string>();
  const uniqueCourses = courses.filter((item) => {
    if (!item?.course?.id) return false;
    if (seenEnrollmentCourseIds.has(item.course.id)) return false;
    seenEnrollmentCourseIds.add(item.course.id);
    return true;
  });

  // Strict check whether a course is REALLY completed
  const isCourseReallyCompleted = (item: EnrolledCourseItem): boolean => {
    // 1. Explicit verified flag or existing certificate from backend
    if (item.isCompleted === true || item.hasCertificate === true) {
      return true;
    }
    // 2. If curriculum has lessons configured, student must have completed all of them (or reached 100%)
    if (item.totalLessonsCount > 0) {
      return item.completedLessonsCount >= item.totalLessonsCount || item.progressPercent >= 100;
    }
    // 3. Fallback only if no lesson count is available: status COMPLETED and progress 100%
    return item.status === 'COMPLETED' && item.progressPercent >= 100;
  };

  const allCount = uniqueCourses.length;
  const activeCount = uniqueCourses.filter((item) => !item.isExpired && !isCourseReallyCompleted(item) && (item.status === 'ACTIVE' || item.status === 'COMPLETED')).length;
  const completedCount = uniqueCourses.filter((item) => isCourseReallyCompleted(item)).length;

  const filteredCourses = uniqueCourses.filter((item) => {
    const isCompleted = isCourseReallyCompleted(item);

    if (activeTab === 'ACTIVE') {
      // Must not be expired and must not be already really completed
      if (item.isExpired || isCompleted) return false;
      if (item.status !== 'ACTIVE' && item.status !== 'COMPLETED') return false;
    }

    if (activeTab === 'COMPLETED') {
      // Completed filter: MUST be really completed!
      if (!isCompleted) return false;
    }

    if (search && !item.course.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const primaryLevelCourses = filteredCourses.filter(c => c.course.level === primaryLevel);
  const additionalCourses = filteredCourses.filter(c => c.course.level !== primaryLevel);

  function renderCourseCard(item: EnrolledCourseItem, idx: number) {
    const isCompleted = isCourseReallyCompleted(item);
    const isAccessActive = (item.status === 'ACTIVE' || item.status === 'COMPLETED' || isCompleted) && !item.isExpired;

    return (
      <Card
        key={`${item.id}-${item.course?.id || ''}-${idx}`}
        className="overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-md"
      >
        <div>
          {/* Card Banner Header */}
          <div className="bg-slate-900 text-white p-4">
            <div className="flex items-center justify-between">
              <Badge variant="indigo" className="bg-primary-600 text-white">
                Level {item.course.level}
              </Badge>
              {isCompleted ? (
                <Badge variant="indigo" className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 font-bold shadow-xs">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </Badge>
              ) : item.isExpired ? (
                <Badge variant="destructive">Access Expired</Badge>
              ) : item.status === 'ACTIVE' ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="warning">Verification Pending</Badge>
              )}
            </div>
            <h3 className="mt-2 text-base font-bold text-white line-clamp-1">
              {item.course.title}
            </h3>
            <p className="text-[11px] text-slate-300">
              Instructor: {item.course.teacher.user.firstName} {item.course.teacher.user.lastName}
            </p>
          </div>

          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-slate-500 line-clamp-2">
              {item.course.description}
            </p>

            {/* Expiration Warning */}
            {item.daysRemaining !== null && item.daysRemaining <= 7 && !item.isExpired && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 p-2.5 text-[11px] font-semibold text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Expires in {item.daysRemaining} days. Renew anytime to retain uninterrupted access.</span>
              </div>
            )}

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">Curriculum Progress</span>
                <span className={isCompleted ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-primary-600"}>
                  {isCompleted ? 100 : item.progressPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-primary-600'}`}
                  style={{ width: `${isCompleted ? 100 : item.progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isCompleted && item.totalLessonsCount > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 inline" /> All {item.totalLessonsCount} lessons completed!
                  </span>
                ) : (
                  `${item.completedLessonsCount} of ${item.totalLessonsCount} lessons finished`
                )}
              </span>
            </div>
          </CardContent>
        </div>

        {/* Card Action Footer */}
        <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-4">
          {isAccessActive ? (
            <Link href={`/student/learn/${item.course.id}`} className="w-full">
              <Button
                variant={isCompleted ? "outline" : "gradient"}
                size="sm"
                className={`w-full ${
                  isCompleted
                    ? 'text-emerald-700 border-emerald-300 dark:border-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold'
                    : ''
                }`}
              >
                {isCompleted ? (
                  <>
                    <FileCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Review Course
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                    Continue Learning
                  </>
                )}
              </Button>
            </Link>
          ) : item.isExpired ? (
            <Link href="/student" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Contact Instructor
              </Button>
            </Link>
          ) : (
            <Link href="/student" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Awaiting Level Access
              </Button>
            </Link>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Enrolled Curriculum</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Enrolled Courses
          </h1>
          <p className="text-xs text-slate-500">
            Track syllabus progress and access interactive lesson content.
          </p>
        </div>
        <Link href="/student">
          <Button variant="outline" size="sm">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Learning Dashboard
          </Button>
        </Link>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>All Courses</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${activeTab === 'ALL' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
              {allCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Active</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${activeTab === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'COMPLETED'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Completed</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${activeTab === 'COMPLETED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
              {completedCount}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search your courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={3} columns="3" />
      ) : filteredCourses.length > 0 ? (
        <div className="space-y-10">
          {primaryLevelCourses.length > 0 && (
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Layers className="h-5 w-5 text-emerald-600" />
                Primary Level Courses ({primaryLevel})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {primaryLevelCourses.map((item, idx) => renderCourseCard(item, idx))}
              </div>
            </div>
          )}

          {additionalCourses.length > 0 && (
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mb-4 mt-6">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Additional Course Access
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {additionalCourses.map((item, idx) => renderCourseCard(item, idx))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No enrolled courses found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            You don't have active course enrollments yet. Contact your instructor or check your CEFR level program on your dashboard.
          </p>
          <Link href="/student">
            <Button variant="gradient" size="sm">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Go to Learning Dashboard
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
