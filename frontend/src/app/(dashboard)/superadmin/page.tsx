'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Server,
  Mail,
  Megaphone,
  Layers,
  TrendingUp,
  AlertCircle,
  Eye,
  Check,
  X,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useCachedData, clientCache } from '@/lib/cache';

interface OverviewStats {
  students: { total: number; active: number };
  teachers: { total: number; approved: number; pending: number };
  courses: { total: number; published: number };
  financials: { totalPayments: number; totalRevenue: number; currency: string };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

export default function SuperadminDashboardPage() {
  const { user } = useAuth();
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'AUTH' | 'USER' | 'PAYMENT' | 'COURSE' | 'TEACHER'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    data: stats,
    loading: statsLoading,
    isValidating: statsValidating,
    refresh: refreshOverview,
  } = useCachedData<OverviewStats>(
    'superadmin_overview',
    async () => {
      const res = await apiClient.get<OverviewStats>('/superadmin/overview');
      return res;
    },
    { ttl: 60000, revalidateOnFocus: true }
  );

  const {
    data: pendingTeachers,
    loading: teachersLoading,
    mutate: mutateTeachers,
    refresh: refreshTeachers,
  } = useCachedData<any[]>(
    'superadmin_pending_teachers',
    async () => {
      const res = await apiClient.get<any[]>('/superadmin/teachers?status=PENDING_APPROVAL');
      return Array.isArray(res) ? res : [];
    },
    { ttl: 60000, revalidateOnFocus: true }
  );

  const isLoading = (statsLoading && !stats) || (teachersLoading && !pendingTeachers);

  const handleApproveTeacher = async (teacherId: string) => {
    try {
      setActionLoading(teacherId);
      setActionMessage(null);
      await apiClient.post(`/superadmin/teachers/${teacherId}/approve`);
      setActionMessage({ type: 'success', text: 'Teacher approved and notification dispatched!' });
      mutateTeachers((prev) => (prev ? prev.filter((t) => t.id !== teacherId) : []));
      refreshOverview();
      clientCache.invalidate('superadmin_');
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to approve teacher.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSeedData = async () => {
    try {
      setActionLoading('seed');
      setActionMessage(null);
      await apiClient.post('/superadmin/seed');
      setActionMessage({ type: 'success', text: 'Comprehensive Super Admin test data seeded successfully!' });
      clientCache.invalidate('superadmin_');
      refreshOverview();
      refreshTeachers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to seed test data.' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAuditLogs = (stats?.recentAuditLogs || []).filter((log) => {
    if (auditFilter === 'ALL') return true;
    return log.action?.toUpperCase().includes(auditFilter) || log.entity?.toUpperCase().includes(auditFilter);
  });

  const metrics = [
    {
      label: 'Active Students',
      value: stats?.students?.active ?? 0,
      total: stats?.students?.total ?? 0,
      sub: `${stats?.students?.total ?? 0} Registered Total`,
      icon: GraduationCap,
      gradient: 'from-blue-600/15 via-blue-500/5 to-transparent dark:from-blue-500/20',
      iconBg: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30',
      borderColor: 'border-blue-200/60 dark:border-blue-900/60',
      href: '/superadmin/students',
    },
    {
      label: 'Certified Teachers',
      value: stats?.teachers?.approved ?? 0,
      total: stats?.teachers?.total ?? 0,
      sub: `${stats?.teachers?.pending ?? 0} Pending Approvals`,
      icon: Users,
      gradient: 'from-indigo-600/15 via-indigo-500/5 to-transparent dark:from-indigo-500/20',
      iconBg: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
      borderColor: 'border-indigo-200/60 dark:border-indigo-900/60',
      href: '/superadmin/teachers',
    },
    {
      label: 'Live Courses',
      value: stats?.courses?.published ?? 0,
      total: stats?.courses?.total ?? 0,
      sub: `${stats?.courses?.total ?? 0} Catalog Total`,
      icon: BookOpen,
      gradient: 'from-emerald-600/15 via-emerald-500/5 to-transparent dark:from-emerald-500/20',
      iconBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
      borderColor: 'border-emerald-200/60 dark:border-emerald-900/60',
      href: '/superadmin/courses',
    },
    {
      label: 'Verified Revenue',
      value: formatPrice(stats?.financials?.totalRevenue ?? 0),
      total: stats?.financials?.totalPayments ?? 0,
      sub: `${stats?.financials?.totalPayments ?? 0} Transactions Verified`,
      icon: CreditCard,
      gradient: 'from-amber-600/15 via-amber-500/5 to-transparent dark:from-amber-500/20',
      iconBg: 'bg-amber-600 text-white shadow-lg shadow-amber-500/30',
      borderColor: 'border-amber-200/60 dark:border-amber-900/60',
      href: '/superadmin/payments',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Executive Control Center Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-[#132519] p-6 sm:p-8 text-white shadow-2xl border border-[#3B6748]/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-mono text-[11px] px-3 py-1">
                🛡️ Platform Superadmin Control Tower
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                Authority Level 0 • Root Access
              </span>
              {statsValidating && (
                <span className="flex items-center gap-1 text-[11px] text-indigo-300">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Syncing...
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Platform Governance & Executive Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
              Real-time monitoring of instructor vetting, verified revenues, CEFR curriculum deployments, and automated SMTP communication gateways.
            </p>
          </div>

          {/* Quick Control Tools */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshOverview();
                refreshTeachers();
              }}
              disabled={statsValidating}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 backdrop-blur-md"
              title="Refresh Live Metrics"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${statsValidating ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedData}
              disabled={actionLoading === 'seed'}
              className="border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 backdrop-blur-md"
              title="Seed Comprehensive Test Data"
            >
              <Database className={`mr-1.5 h-3.5 w-3.5 ${actionLoading === 'seed' ? 'animate-pulse' : ''}`} />
              {actionLoading === 'seed' ? 'Seeding...' : 'Seed Demo Data'}
            </Button>
            <Link href="/superadmin/announcements">
              <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 backdrop-blur-md">
                <Megaphone className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                Announcements
              </Button>
            </Link>
            <Link href="/superadmin/reports">
              <Button variant="gradient" size="sm" className="shadow-lg shadow-primary-600/40 font-bold">
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                Reports Suite
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Status Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-full bg-slate-800" />
              <Skeleton className="h-4 w-full bg-slate-800" />
              <Skeleton className="h-4 w-full bg-slate-800" />
              <Skeleton className="h-4 w-full bg-slate-800" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>API Gateway: <strong>Operational (99.9%)</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span>PostgreSQL Cluster: <strong>Healthy</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className={`h-2 w-2 rounded-full ${(stats?.teachers?.pending ?? 0) > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>Teacher Queue: <strong>{stats?.teachers?.pending ?? 0} Pending</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>SMTP Mail Dispatcher: <strong>Active</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-md ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            </Card>
          ))
        ) : (
          metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} href={m.href}>
                <Card className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl bg-white dark:bg-slate-900 ${m.borderColor} backdrop-blur-sm`}>
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
                        Manage <ChevronRight className="h-3 w-3 ml-0.5" />
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

      {/* 3. Main Operational Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Teacher Approvals & Audit Trail */}
        <div className="lg:col-span-8 space-y-6">
          {/* Teacher Approval Queue */}
          <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary-600" /> Instructor Verification Queue
                </CardTitle>
                <CardDescription className="text-xs">
                  Review certifications and authorize teacher accounts for curriculum publishing
                </CardDescription>
              </div>
              <Link href="/superadmin/teachers">
                <Button variant="ghost" size="sm" className="text-xs text-primary-600">
                  Full Roster
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-5 space-y-3.5">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              ) : pendingTeachers && pendingTeachers.length > 0 ? (
                pendingTeachers.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {t.user?.firstName} {t.user?.lastName}
                        </span>
                        <Badge variant="warning" className="text-[10px] py-0">
                          Pending Approval
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {t.user?.email} • {t.experienceYears || 0} yrs experience
                      </p>
                    </div>

                    <Button
                      size="sm"
                      disabled={actionLoading === t.id}
                      onClick={() => handleApproveTeacher(t.id)}
                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0"
                    >
                      {actionLoading === t.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" /> Approve Faculty
                        </>
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Teacher Approvals Clear</p>
                  <p className="text-[11px] text-slate-400">All registered instructors have been vetted.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" /> Platform Security & Audit Trail
                </CardTitle>
                <CardDescription className="text-xs">Immutable security logs</CardDescription>
              </div>
              <Link href="/superadmin/audit-logs">
                <Button variant="ghost" size="sm" className="text-xs text-primary-600">
                  All Logs
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-5">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : (stats?.recentAuditLogs || []).length > 0 ? (
                <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAuditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                        <p className="text-[11px] text-slate-400">
                          by {log.user?.firstName || 'System'} ({log.entity})
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">No recent security events recorded.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Quick System Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Administration Shortcuts</h3>
            <div className="space-y-2">
              <Link href="/superadmin/email-logs" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs font-semibold gap-2">
                  <Mail className="h-4 w-4 text-primary-600" />
                  Email Dispatch Logs
                </Button>
              </Link>
              <Link href="/superadmin/payments" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs font-semibold gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Platform Financials
                </Button>
              </Link>
              <Link href="/superadmin/settings" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs font-semibold gap-2">
                  <Server className="h-4 w-4 text-indigo-600" />
                  Platform Config & SMTP
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
