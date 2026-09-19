'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  GraduationCap,
  Search,
  ShieldAlert,
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Edit3,
  X,
  Lock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SuperadminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Level Override Modal State
  const [selectedStudentForLevel, setSelectedStudentForLevel] = useState<any | null>(null);
  const [newCefrLevel, setNewCefrLevel] = useState<string>('B1');
  const [levelReason, setLevelReason] = useState<string>('');

  // Password Reset Modal State
  const [selectedStudentForPassword, setSelectedStudentForPassword] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any[]>('/superadmin/students');
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err: any) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleToggleStatus = async (student: any, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/students/${student.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setMessage({ type: 'success', text: `Student account set to ${newStatus}.` });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, status: newStatus } : s))
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update student status' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForLevel) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/students/${selectedStudentForLevel.id}/level`, {
        method: 'PATCH',
        body: JSON.stringify({ level: newCefrLevel, reason: levelReason }),
      });
      setMessage({
        type: 'success',
        text: `CEFR level for ${selectedStudentForLevel.firstName} updated to ${newCefrLevel}.`,
      });
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudentForLevel.id
            ? {
                ...s,
                studentProfile: {
                  ...s.studentProfile,
                  currentLevel: newCefrLevel,
                },
              }
            : s
        )
      );
      setSelectedStudentForLevel(null);
      setLevelReason('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update student CEFR level' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPassword || !newPassword) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/users/${selectedStudentForPassword.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      setMessage({
        type: 'success',
        text: `Password reset successfully for ${selectedStudentForPassword.firstName} (${selectedStudentForPassword.email}).`,
      });
      setSelectedStudentForPassword(null);
      setNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reset student password' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.email} ${s.studentProfile?.nativeLanguage || ''} ${s.studentProfile?.currentLevel || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Student Management</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Directory & Progression
          </h1>
          <p className="text-xs text-slate-500">
            Inspect learner baseline CEFR levels, override placements, manage access, and reset passwords.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search students by name, email, level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
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

      {/* Students Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Learner Name</th>
                <th className="px-5 py-3.5">CEFR Placement</th>
                <th className="px-5 py-3.5">Language & Goals</th>
                <th className="px-5 py-3.5">Enrollments</th>
                <th className="px-5 py-3.5">Joined Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        fallback={`${s.firstName?.[0] || 'S'}${s.lastName?.[0] || ''}`}
                        className="h-8 w-8 text-xs bg-indigo-100 text-indigo-800 font-bold"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{s.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="indigo" className="text-[10px] font-bold">
                        {s.studentProfile?.currentLevel || 'PRE_A1'}
                      </Badge>
                      {s.studentProfile?.targetLevel && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          ➔ {s.studentProfile?.targetLevel}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600"
                        title="Override CEFR Level"
                        onClick={() => {
                          setSelectedStudentForLevel(s);
                          setNewCefrLevel(s.studentProfile?.currentLevel || 'B1');
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    <p className="font-medium text-xs text-slate-800 dark:text-slate-200">
                      {s.studentProfile?.nativeLanguage || 'English / Multilingual'}
                    </p>
                    {s.studentProfile?.learningGoals?.length > 0 && (
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">
                        {s.studentProfile.learningGoals.join(', ')}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {s.studentProfile?._count?.enrollments ?? 1} Active
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-500 text-[11px]">{formatDate(s.createdAt)}</td>

                  <td className="px-5 py-4">
                    {s.status === 'ACTIVE' ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        title="Reset Password"
                        onClick={() => {
                          setSelectedStudentForPassword(s);
                          setNewPassword('');
                        }}
                      >
                        <KeyRound className="h-3 w-3 mr-1" />
                        Reset
                      </Button>

                      {s.status === 'ACTIVE' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleToggleStatus(s, 'SUSPENDED')}
                          className="h-7 text-[11px] px-2.5"
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleToggleStatus(s, 'ACTIVE')}
                          className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <GraduationCap className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-medium">No students found matching current filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Level Override Modal */}
      {selectedStudentForLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 animate-scale-in">
            <CardHeader className="p-0 mb-4">
              <Badge variant="indigo" className="w-fit mb-1">Academic Governance</Badge>
              <CardTitle className="text-lg font-bold">Override CEFR Level</CardTitle>
              <CardDescription className="text-xs">
                Manually adjust English proficiency baseline for {selectedStudentForLevel.firstName}{' '}
                {selectedStudentForLevel.lastName}.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleUpdateLevel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Recommended CEFR Level
                </label>
                <select
                  value={newCefrLevel}
                  onChange={(e) => setNewCefrLevel(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <option value="PRE_A1">Pre-A1 (Absolute Beginner)</option>
                  <option value="A1">A1 (Beginner)</option>
                  <option value="A2">A2 (Elementary)</option>
                  <option value="B1">B1 (Intermediate)</option>
                  <option value="B2">B2 (Upper-Intermediate)</option>
                  <option value="C1">C1 (Advanced)</option>
                  <option value="C2">C2 (Proficiency / Mastery)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Audit Reason / Notes
                </label>
                <textarea
                  rows={2}
                  value={levelReason}
                  onChange={(e) => setLevelReason(e.target.value)}
                  placeholder="e.g. Oral interview reassessment completed by instructor"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudentForLevel(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Update Placement'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Password Reset Modal */}
      {selectedStudentForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 animate-scale-in">
            <CardHeader className="p-0 mb-4">
              <Badge variant="destructive" className="w-fit mb-1">Security Credential Reset</Badge>
              <CardTitle className="text-lg font-bold">Reset Student Password</CardTitle>
              <CardDescription className="text-xs">
                Enter a new temporary or permanent password for {selectedStudentForPassword.email}.
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
                  onClick={() => setSelectedStudentForPassword(null)}
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
