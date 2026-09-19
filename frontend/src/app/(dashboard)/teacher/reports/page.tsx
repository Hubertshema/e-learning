'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  DollarSign,
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  Sparkles,
  BarChart3,
  Download
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface TeacherReportsData {
  totalRevenue: number;
  totalStudentsEnrolled: number;
  activeCoursesCount: number;
  overallAttendanceRate: number;
  courseBreakdown: Array<{
    id: string;
    title: string;
    level: string;
    enrollmentCount: number;
    revenue: number;
  }>;
}

export default function TeacherReportsPage() {
  const [data, setData] = useState<TeacherReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<TeacherReportsData>('/teacher/reports');
        if (res) {
          const reportData = (res as any)?.data || res;
          setData(reportData);
        }
      } catch (err) {
        console.error('Failed to load teacher reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!data || !data.courseBreakdown) return;
    const headers = ['Course Title', 'CEFR Level', 'Enrolled Students', 'Gross Earnings ($)'];
    const rows = data.courseBreakdown.map((c) => [
      `"${c.title.replace(/"/g, '""')}"`,
      c.level,
      c.enrollmentCount,
      c.revenue.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `teacher_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Analytics & Financial Insights</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Instructor Performance & Revenue Reports
          </h1>
          <p className="text-xs text-slate-500">
            Monitor course enrollment velocity, verified tuition earnings, and student attendance consistency.
          </p>
        </div>
        {data && (
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1.5 h-3.5 w-3.5 text-primary-600" />
            Export CSV Report
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading performance reports...</div>
      ) : data ? (
        <>
          {/* Top KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Verified Revenue</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                ${data.totalRevenue.toFixed(2)}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                Direct student tuition
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Enrolled Learners</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {data.totalStudentsEnrolled}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Across all your courses</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Curriculum</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {data.activeCoursesCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Published courses</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Attendance Punctuality</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <CalendarCheck className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {data.overallAttendanceRate}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Average cohort attendance</p>
            </Card>
          </div>

          {/* Revenue Breakdown by Course */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary-600" />
                Course Enrollment & Earnings Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Performance metrics aggregated by CEFR course program
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.courseBreakdown && data.courseBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                        <th className="pb-3 font-semibold">Course Program</th>
                        <th className="pb-3 font-semibold">CEFR Level</th>
                        <th className="pb-3 font-semibold">Enrolled Students</th>
                        <th className="pb-3 font-semibold text-right">Gross Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.courseBreakdown.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                            {c.title}
                          </td>
                          <td className="py-3.5">
                            <Badge variant="indigo">{c.level}</Badge>
                          </td>
                          <td className="py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                            {c.enrollmentCount} Learners
                          </td>
                          <td className="py-3.5 text-right font-black text-slate-900 dark:text-white">
                            ${c.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No courses data available.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center text-slate-400">
          No reporting data available.
        </Card>
      )}
    </div>
  );
}
