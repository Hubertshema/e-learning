'use client';

import React from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, PieChart, Users, DollarSign, Download, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCachedData } from '@/lib/cache';
import { Skeleton } from '@/components/ui/skeleton';

interface ReportResponse {
  revenueTrends: Array<{ month: string; revenue: number; enrollments: number }>;
  cefrEnrollmentDistribution: Array<{ level: string; count: number; percentage: number }>;
  kpis: {
    avgOrderValue: number;
    completionRate: string;
    teacherRetention: string;
  };
}

export default function SuperadminReportsPage() {
  const {
    data: reportData,
    loading,
    isValidating,
    refresh,
  } = useCachedData<ReportResponse>(
    'superadmin_reports',
    async () => {
      const data = await apiClient.get<ReportResponse>('/superadmin/reports');
      return data;
    },
    { ttl: 60000, revalidateOnFocus: true }
  );

  const revenueTrends = reportData?.revenueTrends || [];
  const cefrDistribution = reportData?.cefrEnrollmentDistribution || [];
  const kpis = reportData?.kpis;
  const maxRevenue = Math.max(...revenueTrends.map((t) => t.revenue), 1000);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Analytics & Insights</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Platform Growth & Academic Reports
          </h1>
          <p className="text-xs text-slate-500">
            Monitor revenue trajectory, student CEFR level distribution, and completion rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()} disabled={isValidating} className="h-8">
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading && !reportData ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-36" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">Average Course Tuition</span>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {formatPrice(kpis?.avgOrderValue ?? 0)}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Calculated across verified payments</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">Curriculum Completion Rate</span>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {kpis?.completionRate || '0%'}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Student persistence metric</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">Instructor Retention</span>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {kpis?.teacherRetention || '100%'}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Active faculty standing</p>
            </Card>
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Revenue & Enrollment Trend Bar Chart */}
        <div className="lg:col-span-7">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue & Intake Trajectory</h3>
              </div>
              <Badge variant="indigo">Monthly</Badge>
            </div>

            {loading && !reportData ? (
              <div className="py-12 space-y-4">
                <Skeleton className="h-44 w-full rounded-xl" />
              </div>
            ) : revenueTrends.length > 0 ? (
              <div className="pt-6">
                <div className="flex items-end justify-between gap-3 h-48 border-b border-slate-200 dark:border-slate-800 pb-2">
                  {revenueTrends.map((t) => {
                    const heightPercent = maxRevenue > 0 ? Math.round((t.revenue / maxRevenue) * 100) : 0;
                    return (
                      <div key={t.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          ${t.revenue}
                        </span>
                        <div
                          className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-primary-600 to-indigo-500 transition-all hover:brightness-110"
                          style={{ height: `${Math.max(8, heightPercent)}%` }}
                        />
                        <span className="text-[11px] font-semibold text-slate-500">{t.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Revenue trends will populate as student course transactions are verified.
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (5 cols): CEFR Level Distribution */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">CEFR Placement Distribution</h3>
              </div>
            </div>

            {loading && !reportData ? (
              <div className="py-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : cefrDistribution.length > 0 ? (
              <div className="space-y-4 pt-4">
                {cefrDistribution.map((d) => (
                  <div key={d.level} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{d.level}</span>
                      <span className="font-bold text-primary-600">
                        {d.count} ({d.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                CEFR distribution reflects active student placements.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
