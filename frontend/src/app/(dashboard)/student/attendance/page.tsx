'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData } from '@/lib/cache';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT';
  remarks?: string;
  class: {
    name: string;
    course: {
      title: string;
      level: string;
    };
  };
}

interface AttendanceData {
  records: AttendanceRecord[];
  stats: {
    totalSessions: number;
    presentSessions: number;
    lateSessions: number;
    excusedSessions: number;
    absentSessions: number;
    overallAttendanceRate: number;
  };
}

export default function StudentAttendancePage() {
  const { data, loading } = useCachedData<AttendanceData | null>(
    'student_attendance_data',
    async () => {
      const res = await apiClient.get<AttendanceData>('/students/attendance');
      return (res as any)?.data || res || null;
    },
    { ttl: 120_000 }
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <Badge variant="indigo">Cohort Participation</Badge>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Class Attendance Register
        </h1>
        <p className="text-xs text-slate-500">
          View your session presence record, punctuality rate, and instructor participation notes.
        </p>
      </div>

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-2 w-16" />
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <Skeleton className="h-5 w-48 mb-4" />
            <TableSkeleton rows={5} columns={4} />
          </Card>
        </div>
      ) : data ? (
        <>
          {/* Top KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">Punctuality Score</span>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {data.stats.overallAttendanceRate}%
              </p>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold">Overall Attendance</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">Present</span>
              <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {data.stats.presentSessions}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">On-time sessions</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">Late</span>
              <p className="mt-2 text-2xl font-black text-amber-500">
                {data.stats.lateSessions}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Joined after start</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">Excused</span>
              <p className="mt-2 text-2xl font-black text-blue-500">
                {data.stats.excusedSessions}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Notified instructor</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">Absent</span>
              <p className="mt-2 text-2xl font-black text-rose-500">
                {data.stats.absentSessions}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Unexcused missed</p>
            </Card>
          </div>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary-600" />
                Session Attendance History ({data.records.length} Recorded)
              </CardTitle>
              <CardDescription className="text-xs">
                Official presence logs recorded by your cohort instructors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.records.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Cohort & Course</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Instructor Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3.5 font-mono text-slate-500">
                            {new Date(r.date).toLocaleDateString()}
                          </td>
                          <td className="py-3.5">
                            <p className="font-bold text-slate-900 dark:text-white">{r.class.name}</p>
                            <p className="text-[11px] text-slate-500">{r.class.course.title}</p>
                          </td>
                          <td className="py-3.5">
                            {r.status === 'PRESENT' ? (
                              <Badge variant="success">Present</Badge>
                            ) : r.status === 'LATE' ? (
                              <Badge variant="warning">Late</Badge>
                            ) : r.status === 'EXCUSED' ? (
                              <Badge variant="indigo">Excused</Badge>
                            ) : (
                              <Badge variant="destructive">Absent</Badge>
                            )}
                          </td>
                          <td className="py-3.5 text-slate-600 dark:text-slate-400">
                            {r.remarks || 'Active cohort participation'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No attendance records recorded yet. Live cohort sessions will appear here once marked by your teacher.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center text-slate-400">Failed to load attendance records.</Card>
      )}
    </div>
  );
}
