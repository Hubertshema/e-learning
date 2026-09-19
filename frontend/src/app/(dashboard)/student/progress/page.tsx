'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  CalendarCheck,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCachedData } from '@/lib/cache';

interface ProgressResponse {
  profile: {
    currentLevel: string;
    targetLevel?: string;
  };
  skills: Record<string, { total: number; count: number; score: number }>;
  totalStudyTimeMinutes: number;
  completedLessonsCount: number;
  quizzesPassedCount: number;
  attendances: Array<{
    id: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    note?: string;
    class: {
      name: string;
    };
  }>;
}

export default function StudentProgressPage() {
  const { data, loading, refresh } = useCachedData<ProgressResponse | null>(
    'student_progress',
    async () => {
      const res = await apiClient.get<ProgressResponse>('/student/progress');
      return (res as any)?.data || res || null;
    },
    { ttl: 60_000 }
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">CEFR Diagnostic Scorecards</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            7-Skill Progress & Attendance History
          </h1>
          <p className="text-xs text-slate-500">
            Real-time mastery tracking across Reading, Listening, Speaking, Writing, Grammar, Vocabulary, and Pronunciation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Sync Real-Time
          </Button>
          <Link href="/student/placement">
            <Button variant="gradient" size="sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Recalibrate Diagnostic Level
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-2.5 w-28" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </Card>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <TableSkeleton rows={4} columns={3} />
            </Card>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">CEFR Current Level</span>
                <Badge variant="indigo">{data.profile.currentLevel || 'A1'}</Badge>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {data.profile.currentLevel || 'A1'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Target: {data.profile.targetLevel || 'B2'}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Study Time</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {Math.floor(data.totalStudyTimeMinutes / 60)}h {data.totalStudyTimeMinutes % 60}m
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Logged in interactive player</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Completed Lessons</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {data.completedLessonsCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Across all enrolled units</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Quizzes Passed</span>
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {data.quizzesPassedCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Knowledge checks verified</p>
            </Card>
          </div>

          {/* 7-Skill Mastery Matrix */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              7-Skill English Competency Matrix
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(data.skills).map(([skill, item]) => {
                const isHigh = item.score >= 80;
                const isMed = item.score >= 65 && item.score < 80;
                return (
                  <Card key={skill} className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{skill}</span>
                      <Badge variant={isHigh ? 'success' : isMed ? 'indigo' : 'warning'} className="text-[10px]">
                        {isHigh ? 'Proficient' : isMed ? 'Competent' : 'Developing'}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {item.score}%
                      </span>
                      <span className="text-[11px] text-slate-400">Mastery Index</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh ? 'bg-emerald-500' : isMed ? 'bg-primary-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary-600" />
                Live Cohort Attendance Log
              </CardTitle>
              <CardDescription className="text-xs">
                Records of your presence and punctuality in live class sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.attendances && data.attendances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                        <th className="pb-3 font-semibold">Cohort / Class</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Instructor Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.attendances.map((att) => (
                        <tr key={att.id}>
                          <td className="py-3 font-bold text-slate-900 dark:text-white">
                            {att.class.name}
                          </td>
                          <td className="py-3 text-slate-500">
                            {new Date(att.date).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={
                                att.status === 'PRESENT'
                                  ? 'success'
                                  : att.status === 'LATE'
                                  ? 'warning'
                                  : att.status === 'EXCUSED'
                                  ? 'indigo'
                                  : 'destructive'
                              }
                            >
                              {att.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400 italic">
                            {att.note || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No attendance records logged for live cohorts yet.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center text-slate-400">
          No progress records available.
        </Card>
      )}
    </div>
  );
}
