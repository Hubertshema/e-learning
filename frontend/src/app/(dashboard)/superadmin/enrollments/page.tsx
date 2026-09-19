'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  UserCheck,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Calendar,
  CreditCard,
  BookOpen,
  PlusCircle,
  MoreVertical,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function SuperadminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extend Modal State
  const [selectedEnrollment, setSelectedEnrollment] = useState<any | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [showExtendModal, setShowExtendModal] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any[]>('/superadmin/enrollments');
      if (Array.isArray(data)) {
        setEnrollments(data);
      }
    } catch (err: any) {
      console.error('Failed to load enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleUpdateStatus = async (enrollmentId: string, newStatus: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/enrollments/${enrollmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setMessage({ type: 'success', text: `Enrollment status updated to ${newStatus} successfully.` });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, status: newStatus } : e))
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update enrollment status' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const result: any = await apiClient(`/superadmin/enrollments/${selectedEnrollment.id}/extend`, {
        method: 'POST',
        body: JSON.stringify({ days: Number(extendDays) }),
      });
      setMessage({
        type: 'success',
        text: `Extended course access by ${extendDays} days for ${selectedEnrollment.student?.user?.firstName || 'Student'}.`,
      });
      setEnrollments((prev) =>
        prev.map((item) =>
          item.id === selectedEnrollment.id
            ? { ...item, status: 'ACTIVE', expiresAt: result?.expiresAt || item.expiresAt }
            : item
        )
      );
      setShowExtendModal(false);
      setSelectedEnrollment(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to extend enrollment access' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((item) => {
    const sName = `${item.student?.user?.firstName || ''} ${item.student?.user?.lastName || ''} ${item.student?.user?.email || ''}`;
    const cTitle = item.course?.title || '';
    const tName = `${item.course?.teacher?.user?.firstName || ''} ${item.course?.teacher?.user?.lastName || ''}`;
    const matchesSearch = `${sName} ${cTitle} ${tName}`.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    return true;
  });

  const totalActive = enrollments.filter((e) => e.status === 'ACTIVE').length;
  const totalPending = enrollments.filter((e) => e.status === 'PENDING').length;
  const totalExpired = enrollments.filter((e) => e.status === 'EXPIRED').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Enrollment Registry</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Global Course Access & Enrollments
          </h1>
          <p className="text-xs text-slate-500">
            Audit learner course permissions, extend validity periods, and monitor active study enrollments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEnrollments} disabled={loading}>
            Refresh Registry
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Enrollments</span>
            <UserCheck className="h-4 w-4 text-primary-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{enrollments.length}</p>
        </Card>

        <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active Access</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-200">{totalActive}</p>
        </Card>

        <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Pending Activation</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-800 dark:text-amber-200">{totalPending}</p>
        </Card>

        <Card className="p-4 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Expired Access</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-800 dark:text-rose-200">{totalExpired}</p>
        </Card>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['ALL', 'ACTIVE', 'PENDING', 'EXPIRED', 'SUSPENDED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {tab === 'ALL' ? 'All Enrollments' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search learner, email, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Enrollments Table / List */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Learner</th>
                <th className="px-5 py-3.5">Course / Syllabus</th>
                <th className="px-5 py-3.5">Assigned Teacher</th>
                <th className="px-5 py-3.5">Access Status</th>
                <th className="px-5 py-3.5">Enrolled / Expiration</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEnrollments.map((item) => {
                const studentUser = item.student?.user;
                const teacherUser = item.course?.teacher?.user;
                const payment = item.payments?.[0];
                const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <Avatar
                          fallback={studentUser?.firstName?.[0] || 'S'}
                          className="h-8 w-8 text-xs bg-primary-100 text-primary-800 font-bold"
                        />
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {studentUser?.firstName} {studentUser?.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{studentUser?.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white text-xs">
                            {item.course?.title}
                          </span>
                          <Badge variant="indigo" className="text-[10px] px-1.5 py-0">
                            {item.course?.level || 'A1'}
                          </Badge>
                        </div>
                        {item.class && (
                          <p className="text-[11px] text-slate-400">Class: {item.class.name} ({item.class.code})</p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {teacherUser ? (
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {teacherUser.firstName} {teacherUser.lastName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Platform Course</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          item.status === 'ACTIVE'
                            ? 'success'
                            : item.status === 'PENDING'
                            ? 'warning'
                            : item.status === 'EXPIRED'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {item.status}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-[11px] space-y-0.5">
                      <p className="text-slate-500">Enrolled: {formatDate(item.enrolledAt)}</p>
                      <p className={isExpired ? 'text-rose-500 font-semibold' : 'text-slate-500'}>
                        Expires: {item.expiresAt ? formatDate(item.expiresAt) : 'Permanent / N/A'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {payment ? (
                        <div>
                          <Badge
                            variant={payment.status === 'VERIFIED' ? 'success' : 'warning'}
                            className="text-[10px] font-bold"
                          >
                            {payment.status}
                          </Badge>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {formatPrice(payment.amount)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">No payment record</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2.5"
                          onClick={() => {
                            setSelectedEnrollment(item);
                            setShowExtendModal(true);
                          }}
                        >
                          Extend Access
                        </Button>

                        {item.status !== 'ACTIVE' ? (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(item.id, 'ACTIVE')}
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-[11px] px-2.5"
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(item.id, 'SUSPENDED')}
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEnrollments.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <UserCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-medium">No course enrollments matching current criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Extend Duration Modal */}
      {showExtendModal && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 animate-scale-in">
            <CardHeader className="p-0 mb-4">
              <Badge variant="indigo" className="w-fit mb-1">Duration Extension</Badge>
              <CardTitle className="text-lg font-bold">Extend Course Access</CardTitle>
              <CardDescription className="text-xs">
                Grant additional learning days for {selectedEnrollment.student?.user?.firstName}{' '}
                {selectedEnrollment.student?.user?.lastName} in &ldquo;{selectedEnrollment.course?.title}&rdquo;.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleExtendAccess} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Extension Duration
                </label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <option value={30}>+30 Days (1 Month Extension)</option>
                  <option value={60}>+60 Days (2 Months Extension)</option>
                  <option value={90}>+90 Days (3 Months Full Term)</option>
                  <option value={180}>+180 Days (6 Months Semester)</option>
                  <option value={365}>+365 Days (1 Full Academic Year)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-semibold">Current Expiry:</span>{' '}
                  {selectedEnrollment.expiresAt ? formatDate(selectedEnrollment.expiresAt) : 'None / Expired'}
                </p>
                <p>
                  <span className="font-semibold">Learner Account:</span>{' '}
                  {selectedEnrollment.student?.user?.email}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtendModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Extending...' : 'Confirm Extension'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
