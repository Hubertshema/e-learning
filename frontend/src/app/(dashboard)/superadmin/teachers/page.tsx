'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Search,
  Check,
  X,
  Award,
  BookOpen,
  DollarSign,
  AlertCircle,
  FileText,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function SuperadminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED'>('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [hourlyRate, setHourlyRate] = useState<string>('35');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password reset state
  const [selectedTeacherForPassword, setSelectedTeacherForPassword] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any[]>('/superadmin/teachers');
      if (Array.isArray(data)) {
        setTeachers(data);
      }
    } catch (err: any) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleApprove = async (teacher: any) => {
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/teachers/${teacher.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ hourlyRate: parseFloat(hourlyRate) || 30 }),
      });
      setMessage({
        type: 'success',
        text: `Approved instructor ${teacher.firstName} ${teacher.lastName} successfully!`,
      });
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === teacher.id
            ? { ...t, status: 'ACTIVE', teacherProfile: { ...t.teacherProfile, isApproved: true } }
            : t
        )
      );
      setSelectedTeacher(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve teacher' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (teacher: any) => {
    if (!rejectReason) {
      setMessage({ type: 'error', text: 'Please enter a rejection reason.' });
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/teachers/${teacher.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      setMessage({
        type: 'success',
        text: `Rejected application for ${teacher.firstName} ${teacher.lastName}.`,
      });
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === teacher.id
            ? { ...t, status: 'SUSPENDED', teacherProfile: { ...t.teacherProfile, isApproved: false } }
            : t
        )
      );
      setSelectedTeacher(null);
      setRejectReason('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reject teacher' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (teacher: any, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/teachers/${teacher.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setMessage({ type: 'success', text: `Instructor status set to ${newStatus}.` });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacher.id ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForPassword || !newPassword) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/users/${selectedTeacherForPassword.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      setMessage({
        type: 'success',
        text: `Password reset successfully for instructor ${selectedTeacherForPassword.firstName} (${selectedTeacherForPassword.email}).`,
      });
      setSelectedTeacherForPassword(null);
      setNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reset instructor password' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      `${t.firstName} ${t.lastName} ${t.email} ${t.teacherProfile?.headline || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'PENDING') return !t.teacherProfile?.isApproved;
    if (filterTab === 'APPROVED') return t.teacherProfile?.isApproved && t.status === 'ACTIVE';
    if (filterTab === 'SUSPENDED') return t.status === 'SUSPENDED';
    return true;
  });

  const pendingCount = teachers.filter((t) => !t.teacherProfile?.isApproved).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Teacher Management</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Instructor Verification & Directory
          </h1>
          <p className="text-xs text-slate-500">
            Review submitted credentials, approve teaching permissions, assign pay rates, and reset credentials.
          </p>
        </div>
      </div>

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

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTab === tab
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {tab === 'ALL'
                ? 'All Instructors'
                : tab === 'PENDING'
                ? 'Pending Approvals'
                : tab === 'APPROVED'
                ? 'Verified'
                : 'Suspended'}
              {tab === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Teachers List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTeachers.map((teacher) => (
          <Card key={teacher.id} className="p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <Avatar
                  fallback={`${teacher.firstName?.[0] || 'T'}${teacher.lastName?.[0] || ''}`}
                  className="h-12 w-12 text-sm bg-primary-100 text-primary-800 font-bold"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    {teacher.teacherProfile?.isApproved ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="warning">Pending Approval</Badge>
                    )}
                    {teacher.status === 'SUSPENDED' && <Badge variant="destructive">Suspended</Badge>}
                  </div>

                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {teacher.teacherProfile?.headline || 'English Instructor'}
                  </p>

                  <p className="text-xs text-slate-500">
                    {teacher.email} • Registered {formatDate(teacher.createdAt)}
                  </p>

                  {teacher.teacherProfile?.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl pt-1">
                      {teacher.teacherProfile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {teacher.teacherProfile?.qualifications?.map((q: string, i: number) => (
                      <Badge key={i} variant="indigo" className="text-[10px]">
                        <Award className="mr-1 h-3 w-3" />
                        {q}
                      </Badge>
                    ))}
                    {teacher.teacherProfile?.specialties?.map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                    {teacher.teacherProfile?.hourlyRate && (
                      <Badge variant="secondary" className="text-[10px]">
                        <DollarSign className="mr-0.5 h-3 w-3" />
                        {formatPrice(teacher.teacherProfile.hourlyRate)}/hr
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-end justify-center gap-2 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setSelectedTeacherForPassword(teacher);
                    setNewPassword('');
                  }}
                >
                  <KeyRound className="h-3 w-3 mr-1" />
                  Reset Password
                </Button>

                {!teacher.teacherProfile?.isApproved ? (
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setHourlyRate(teacher.teacherProfile?.hourlyRate ? String(teacher.teacherProfile.hourlyRate) : '35');
                    }}
                    className="w-full md:w-36 h-8 text-xs"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Review & Approve
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {teacher.status === 'ACTIVE' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleToggleStatus(teacher, 'SUSPENDED')}
                        disabled={actionLoading}
                        className="h-8 text-xs"
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleToggleStatus(teacher, 'ACTIVE')}
                        disabled={actionLoading}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Reactivate
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredTeachers.length === 0 && !loading && (
          <div className="text-center py-12 text-sm text-slate-500">
            No instructors found matching your criteria.
          </div>
        )}
      </div>

      {/* Review & Approval Modal Dialog */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg p-6 space-y-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <CardTitle className="text-lg font-bold">Review Teacher Application</CardTitle>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <Avatar
                  fallback={`${selectedTeacher.firstName?.[0] || 'T'}${selectedTeacher.lastName?.[0] || ''}`}
                  className="h-10 w-10 text-xs bg-primary-100 text-primary-800 font-bold"
                />
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </p>
                  <p className="text-slate-500">{selectedTeacher.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Headline:</span>
                <p className="text-slate-600 dark:text-slate-400">{selectedTeacher.teacherProfile?.headline || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Teaching Bio:</span>
                <p className="text-slate-600 dark:text-slate-400">{selectedTeacher.teacherProfile?.bio || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Hourly Rate Allocation ($ / USD):</span>
                <Input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="35.00"
                />
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Rejection Reason (if rejecting):</span>
                <Input
                  placeholder="e.g. Incomplete certification documents"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReject(selectedTeacher)}
                disabled={actionLoading}
              >
                Reject Application
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleApprove(selectedTeacher)}
                disabled={actionLoading}
              >
                Approve & Activate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Password Reset Modal */}
      {selectedTeacherForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 animate-scale-in">
            <CardHeader className="p-0 mb-4">
              <Badge variant="destructive" className="w-fit mb-1">Security Credential Reset</Badge>
              <CardTitle className="text-lg font-bold">Reset Instructor Password</CardTitle>
              <CardDescription className="text-xs">
                Enter a new temporary or permanent password for instructor {selectedTeacherForPassword.email}.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password (min 8 characters)
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTeacherForPassword(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Confirm Password Reset'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
