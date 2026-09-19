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
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');

  const { data: rawCourses, loading } = useCachedData<EnrolledCourseItem[]>(
    'student_my_courses',
    async () => {
      const res = await apiClient.get<EnrolledCourseItem[]>('/students/enrollments');
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const courses = Array.isArray(rawCourses) ? rawCourses : [];

  const filteredCourses = courses.filter((item) => {
    if (activeTab === 'ACTIVE' && (item.status !== 'ACTIVE' || item.isExpired)) return false;
    if (activeTab === 'PENDING' && item.status !== 'PENDING') return false;
    if (activeTab === 'EXPIRED' && (!item.isExpired && item.status !== 'EXPIRED')) return false;
    if (activeTab === 'COMPLETED' && item.status !== 'COMPLETED') return false;
    if (search && !item.course.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            Track syllabus progress, access video/audio lessons, and renew expiring access.
          </p>
        </div>
        <Link href="/student/courses">
          <Button variant="gradient" size="sm">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Explore New Courses
          </Button>
        </Link>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['ALL', 'ACTIVE', 'PENDING', 'EXPIRED', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Courses' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
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

      {/* Courses Grid */}
      {loading ? (
        <CardGridSkeleton count={3} columns="3" />
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((item) => {
            const isAccessActive = item.status === 'ACTIVE' && !item.isExpired;
            return (
              <Card
                key={item.id}
                className="overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-md"
              >
                <div>
                  {/* Card Banner Header */}
                  <div className="bg-slate-900 text-white p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="indigo" className="bg-primary-600 text-white">
                        Level {item.course.level}
                      </Badge>
                      {item.isExpired ? (
                        <Badge variant="destructive">Access Expired</Badge>
                      ) : item.status === 'ACTIVE' ? (
                        <Badge variant="success">Active</Badge>
                      ) : item.status === 'COMPLETED' ? (
                        <Badge variant="indigo">Completed</Badge>
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
                        <span className="text-primary-600">{item.progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {item.completedLessonsCount} of {item.totalLessonsCount} lessons finished
                      </span>
                    </div>
                  </CardContent>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-4">
                  {isAccessActive ? (
                    <Link href={`/student/learn/${item.course.id}`} className="w-full">
                      <Button variant="gradient" size="sm" className="w-full">
                        <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                        Continue Learning
                      </Button>
                    </Link>
                  ) : item.isExpired ? (
                    <Link href={`/student/payments?courseId=${item.course.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Renew Course Access
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/student/payments`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        View Verification Status
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No enrolled courses found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            You haven't enrolled in any courses in this category yet. Explore the course catalog to start your learning journey.
          </p>
          <Link href="/student/courses">
            <Button variant="gradient" size="sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Explore Course Catalog
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
