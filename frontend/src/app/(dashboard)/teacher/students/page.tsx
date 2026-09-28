'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Users,
  Search,
  GraduationCap,
  Eye,
  Edit3,
  Trash2,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  UserCheck,
  AlertTriangle,
  MoreVertical,
  CalendarDays,
  Shield,
  TrendingUp,
  Filter,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';
import { TableSkeleton } from '@/components/ui/table-skeleton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnrolledStudent {
  id: string;
  userId: string;
  studentId?: string;
  courseId: string;
  classId?: string;
  status: string;
  enrolledAt: string;
  expiresAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentProfile?: { currentLevel: string; targetLevel: string };
  };
  course: { id: string; title: string; level: string };
  class?: { id: string; name: string };
}

interface EnrollmentItem {
  id: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'PENDING';
  enrolledAt: string;
  expiresAt?: string;
  student: { id: string; user: { firstName: string; lastName: string; email: string } };
  course: { id: string; title: string; level: string };
  class?: { name: string };
}

interface ExpiringStudent {
  id: string;
  expiresAt: string;
  status: string;
  student: { id: string; user: { firstName: string; lastName: string; email: string } };
  course: { id: string; title: string; level: string };
  class?: { name: string };
}

interface TeacherClass {
  id: string;
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarInitials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function urgencyColor(days: number) {
  if (days <= 3) return 'text-rose-600 dark:text-rose-400';
  if (days <= 7) return 'text-amber-600 dark:text-amber-400';
  return 'text-sky-600 dark:text-sky-400';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AvatarCircle({ first, last, size = 'md' }: { first: string; last: string; size?: 'sm' | 'md' }) {
  const colors = ['bg-violet-100 text-violet-700', 'bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700', 'bg-sky-100 text-sky-700'];
  const idx = (first.charCodeAt(0) + last.charCodeAt(0)) % colors.length;
  const dim = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
  return (
    <div className={`${dim} flex items-center justify-center rounded-full font-black shrink-0 ${colors[idx]}`}>
      {avatarInitials(first, last)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    EXPIRED: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    PENDING: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    COMPLETED: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {status}
    </span>
  );
}

function Toast({ msg }: { msg: { type: 'success' | 'error'; text: string } }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-semibold shadow-xl border animate-in slide-in-from-bottom-4 duration-300 ${
      msg.type === 'success'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
        : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
    }`}>
      {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {msg.text}
    </div>
  );
}

// ─── Tab: Directory ───────────────────────────────────────────────────────────

function DirectoryTab() {
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<EnrolledStudent | null>(null);
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editClassId, setEditClassId] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editCurrentLevel, setEditCurrentLevel] = useState('A1');
  const [editTargetLevel, setEditTargetLevel] = useState('B2');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<EnrolledStudent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    apiClient.get<any>('/teacher/classes').then((res) => {
      setTeacherClasses((res as any)?.classes || (res as any)?.data || (Array.isArray(res) ? res : []));
    }).catch(() => {});
  }, []);

  const { data: rawStudents, loading, refresh } = useCachedData<EnrolledStudent[]>(
    `teacher_students_${search}`,
    async () => {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiClient.get<any>(`/teacher/students${q}`);
      return (res as any)?.students || (res as any)?.data?.students || (Array.isArray(res) ? res : []);
    },
    { ttl: 120_000, initialData: [] }
  );

  const students = rawStudents || [];

  const openEdit = (st: EnrolledStudent) => {
    setEditingStudent(st);
    setEditStatus(st.status || 'ACTIVE');
    setEditClassId(st.classId || '');
    setEditExpiresAt(st.expiresAt ? new Date(st.expiresAt).toISOString().split('T')[0] : '');
    setEditCurrentLevel(st.user.studentProfile?.currentLevel || 'A1');
    setEditTargetLevel(st.user.studentProfile?.targetLevel || 'B2');
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      setSavingEdit(true);
      await apiClient.patch(`/teacher/students/${editingStudent.id}`, {
        status: editStatus,
        classId: editClassId || null,
        expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
        currentLevel: editCurrentLevel,
        targetLevel: editTargetLevel,
      });
      clientCache.invalidate('teacher_students');
      await refresh();
      setEditingStudent(null);
      showToast('success', `${editingStudent.user.firstName}'s enrollment updated.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update enrollment.');
    } finally {
      setSavingEdit(false);
    }
  };

  const quickToggle = async (st: EnrolledStudent, next: 'ACTIVE' | 'SUSPENDED') => {
    try {
      await apiClient.patch(`/teacher/students/${st.id}`, { status: next });
      clientCache.invalidate('teacher_students');
      await refresh();
      showToast('success', next === 'ACTIVE' ? `${st.user.firstName} reactivated.` : `${st.user.firstName} suspended.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update status.');
    }
  };

  const doDelete = async () => {
    if (!deletingStudent) return;
    try {
      setDeleting(true);
      await apiClient.delete(`/teacher/students/${deletingStudent.id}`);
      clientCache.invalidate('teacher_students');
      await refresh();
      showToast('success', `${deletingStudent.user.firstName} ${deletingStudent.user.lastName} unenrolled.`);
      setDeletingStudent(null);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to unenroll student.');
    } finally {
      setDeleting(false);
    }
  };

  const LEVELS = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const LEVEL_LABELS: Record<string, string> = {
    PRE_A1: 'Pre-A1', A1: 'A1 Beginner', A2: 'A2 Elementary',
    B1: 'B1 Intermediate', B2: 'B2 Upper Int', C1: 'C1 Advanced', C2: 'C2 Mastery',
  };

  return (
    <div className="space-y-4">
      {/* Search + Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => refresh()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Users className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No students found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Student</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Course</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Cohort</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Enrolled</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <AvatarCircle first={st.user.firstName} last={st.user.lastName} />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">
                          {st.user.firstName} {st.user.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{st.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">{st.course.title}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-md border border-indigo-100 dark:border-indigo-800">{st.course.level}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    {st.class?.name ?? <span className="text-slate-400 italic">Self-paced</span>}
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={st.status} /></td>
                  <td className="px-4 py-3.5 text-[11px] text-slate-500">{new Date(st.enrolledAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="relative inline-flex items-center gap-1.5 justify-end">
                      <Link href={`/teacher/students/${st.user?.id || st.userId}`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-300" title="View portfolio">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        size="sm" variant="outline"
                        className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900"
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === st.id ? null : st.id); }}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                      {openMenuId === st.id && (
                        <div
                          className="absolute right-0 top-9 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button onClick={() => { setOpenMenuId(null); openEdit(st); }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                            <Edit3 className="h-3.5 w-3.5 text-slate-400" /> Edit Enrollment
                          </button>
                          {st.status === 'ACTIVE' ? (
                            <button onClick={() => { setOpenMenuId(null); quickToggle(st, 'SUSPENDED'); }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                              <PauseCircle className="h-3.5 w-3.5" /> Suspend Access
                            </button>
                          ) : (
                            <button onClick={() => { setOpenMenuId(null); quickToggle(st, 'ACTIVE'); }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                              <PlayCircle className="h-3.5 w-3.5" /> Reactivate Access
                            </button>
                          )}
                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                          <button onClick={() => { setOpenMenuId(null); setDeletingStudent(st); }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                            <Trash2 className="h-3.5 w-3.5" /> Unenroll Student
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <Modal isOpen={true} onClose={() => setEditingStudent(null)}
          title={`Edit Enrollment — ${editingStudent.user.firstName} ${editingStudent.user.lastName}`}
          description={`Manage cohort, status, and CEFR levels for ${editingStudent.course.title}.`}>
          <form onSubmit={saveEdit} className="space-y-4 pt-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{editingStudent.user.firstName} {editingStudent.user.lastName}</p>
              <p className="text-[11px] text-slate-400">{editingStudent.user.email}</p>
              <div className="pt-1.5 flex gap-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">{editingStudent.course.level}</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">{editingStudent.course.title}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enrollment Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900">
                {['ACTIVE', 'SUSPENDED', 'EXPIRED', 'COMPLETED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Cohort / Class</label>
              <select value={editClassId} onChange={(e) => setEditClassId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900">
                <option value="">None (Self-paced)</option>
                {teacherClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Access Expiration Date</label>
              <Input type="date" value={editExpiresAt} onChange={(e) => setEditExpiresAt(e.target.value)} className="text-xs" />
              <p className="text-[10px] text-slate-400">Leave empty for unlimited access.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current CEFR Level</label>
                <select value={editCurrentLevel} onChange={(e) => setEditCurrentLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900">
                  {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target CEFR Level</label>
                <select value={editTargetLevel} onChange={(e) => setEditTargetLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900">
                  {LEVELS.filter(l => l !== 'PRE_A1').map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingStudent(null)} disabled={savingEdit}>Cancel</Button>
              <Button type="submit" size="sm" disabled={savingEdit}>
                {savingEdit ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deletingStudent && (
        <Modal isOpen={true} onClose={() => setDeletingStudent(null)} title="Unenroll Student" size="sm">
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to unenroll <strong className="text-slate-900 dark:text-white">{deletingStudent.user.firstName} {deletingStudent.user.lastName}</strong> from <strong className="text-slate-900 dark:text-white">{deletingStudent.course.title}</strong>?
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              This will revoke their access to all lessons, quizzes, and sessions in this course.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeletingStudent(null)} disabled={deleting}>Cancel</Button>
              <Button type="button" variant="destructive" size="sm" onClick={doDelete} disabled={deleting}>
                {deleting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Unenrolling...</> : 'Confirm Unenroll'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}

// ─── Tab: Enrollments & Access ────────────────────────────────────────────────

function EnrollmentsTab() {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const { data: rawEnrollments, loading, refresh } = useCachedData<EnrollmentItem[]>(
    'teacher_enrollments_list',
    async () => {
      const res = await apiClient.get<EnrollmentItem[]>('/teacher/enrollments');
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const enrollments = rawEnrollments || [];

  const filtered = useMemo(() => enrollments.filter((e) => {
    const matchStatus = filterStatus === 'ALL' || e.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.student.user.firstName.toLowerCase().includes(q) ||
      e.student.user.lastName.toLowerCase().includes(q) ||
      e.course.title.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [enrollments, filterStatus, search]);

  const doExtend = async (id: string) => {
    try {
      setExtendingId(id);
      await apiClient.post(`/teacher/enrollments/${id}/extend`, { extensionDays: 30, reason: 'Instructor grant from Enrollments manager' });
      clientCache.invalidate('teacher_');
      refresh();
      showToast('success', 'Access extended by 30 days.');
    } catch {
      showToast('error', 'Failed to extend enrollment.');
    } finally {
      setExtendingId(null);
    }
  };

  const doSuspend = async () => {
    if (!suspendId || !suspendReason.trim()) return;
    try {
      setSuspending(true);
      await apiClient.post(`/teacher/enrollments/${suspendId}/suspend`, { reason: suspendReason });
      clientCache.invalidate('teacher_');
      refresh();
      setSuspendId(null);
      setSuspendReason('');
      showToast('success', 'Enrollment suspended.');
    } catch {
      showToast('error', 'Failed to suspend enrollment.');
    } finally {
      setSuspending(false);
    }
  };

  const statusFilters = ['ALL', 'ACTIVE', 'SUSPENDED', 'EXPIRED'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map((st) => (
            <button key={st} onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}>
              {st}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text" placeholder="Search student or course..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </div>

      {loading ? <TableSkeleton rows={6} columns={6} /> : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">No enrollments match the filter.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
                {['Student', 'Course & Level', 'Enrolled On', 'Expires At', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <AvatarCircle first={item.student.user.firstName} last={item.student.user.lastName} size="sm" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.student.user.firstName} {item.student.user.lastName}</p>
                        <p className="text-[10px] text-slate-400">{item.student.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.course.title}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-md border border-indigo-100 dark:border-indigo-800">{item.course.level}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{new Date(item.enrolledAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {item.expiresAt ? (
                      <span>{new Date(item.expiresAt).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-slate-400">Lifetime</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/teacher/students/${item.student.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-slate-500 hover:text-indigo-600">
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => doExtend(item.id)} disabled={extendingId === item.id}>
                        {extendingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : '+30d'}
                      </Button>
                      {item.status === 'ACTIVE' && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1"
                          onClick={() => { setSuspendId(item.id); setSuspendReason(''); }}>
                          <PauseCircle className="h-3 w-3" /> Suspend
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Suspend Reason Modal */}
      {suspendId && (
        <Modal isOpen={true} onClose={() => setSuspendId(null)} title="Suspend Enrollment" size="sm">
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500">Provide a reason for suspending this student's course access.</p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason</label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Payment overdue, policy violation..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs resize-none focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setSuspendId(null)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={doSuspend} disabled={suspending || !suspendReason.trim()}>
                {suspending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Suspending...</> : 'Confirm Suspend'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}

// ─── Tab: Expiring Watchlist ──────────────────────────────────────────────────

function ExpiringTab() {
  const [filterDays, setFilterDays] = useState(7);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const { data: rawStudents, loading, refresh } = useCachedData<ExpiringStudent[]>(
    `teacher_expiring_students_${filterDays}`,
    async () => {
      const res = await apiClient.get<ExpiringStudent[]>(`/teacher/expiring-students?days=${filterDays}`);
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const students = rawStudents || [];

  const doExtend = async (id: string) => {
    try {
      setExtendingId(id);
      await apiClient.post(`/teacher/enrollments/${id}/extend`, {
        extensionDays: 30,
        reason: 'Proactive instructor extension from Expiring Watchlist',
      });
      clientCache.invalidate('teacher_');
      refresh();
      showToast('success', 'Access extended by 30 days.');
    } catch {
      showToast('error', 'Failed to extend enrollment.');
    } finally {
      setExtendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Day window filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Expiring in:</span>
        {[3, 7, 14, 30].map((days) => (
          <button key={days} onClick={() => setFilterDays(days)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterDays === days
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
            }`}>
            Next {days} days
          </button>
        ))}
        <div className="ml-auto">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => refresh()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {loading ? <TableSkeleton rows={5} columns={5} /> : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">All Clear!</p>
          <p className="text-xs text-slate-400 mt-1">No enrollments expiring in the next {filterDays} days.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
                {['Student', 'Course & Level', 'Cohort', 'Expiration', 'Urgency', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {students.map((item) => {
                const days = daysUntil(item.expiresAt);
                return (
                  <tr key={item.id} className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${days <= 3 ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <AvatarCircle first={item.student.user.firstName} last={item.student.user.lastName} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.student.user.firstName} {item.student.user.lastName}</p>
                          <p className="text-[10px] text-slate-400">{item.student.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.course.title}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-md border border-indigo-100 dark:border-indigo-800">{item.course.level}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{item.class?.name ?? <span className="italic text-slate-400">Self-paced</span>}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{new Date(item.expiresAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-black text-[11px] ${urgencyColor(days)}`}>
                        {days <= 0 ? 'Expired today' : `${days}d left`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/teacher/students/${item.student.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-slate-500 hover:text-indigo-600">
                            <Eye className="h-3 w-3" /> View
                          </Button>
                        </Link>
                        <Button
                          size="sm" variant="outline"
                          className="text-xs h-7 gap-1 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
                          onClick={() => doExtend(item.id)}
                          disabled={extendingId === item.id}
                        >
                          {extendingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarDays className="h-3 w-3" />}
                          +30 Days
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'directory' | 'enrollments' | 'expiring';

const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'enrollments', label: 'Enrollments & Access', icon: UserCheck },
  { id: 'expiring', label: 'Expiring Watchlist', icon: AlertTriangle },
];

export default function StudentsDirectoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('directory');

  // Summary stats
  const { data: students } = useCachedData<EnrolledStudent[]>(
    'teacher_students_',
    async () => {
      const res = await apiClient.get<any>('/teacher/students');
      return (res as any)?.students || (res as any)?.data?.students || (Array.isArray(res) ? res : []);
    },
    { ttl: 120_000, initialData: [] }
  );

  const { data: expiring } = useCachedData<ExpiringStudent[]>(
    'teacher_expiring_students_7',
    async () => {
      const res = await apiClient.get<ExpiringStudent[]>('/teacher/expiring-students?days=7');
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const activeCount = (students || []).filter(s => s.status === 'ACTIVE').length;
  const suspendedCount = (students || []).filter(s => s.status === 'SUSPENDED').length;
  const expiringCount = (expiring || []).length;

  const stats = [
    { label: 'Total Students', value: (students || []).length, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Active', value: activeCount, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Suspended', value: suspendedCount, icon: PauseCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Expiring (7d)', value: expiringCount, icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
            <GraduationCap className="h-3 w-3" /> Students
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Students Directory</h1>
        <p className="text-xs text-slate-500">Manage your learners, enrollment access, and expiring watchlists all in one place.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasBadge = tab.id === 'expiring' && expiringCount > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {hasBadge && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                  {expiringCount > 9 ? '9+' : expiringCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'directory' && <DirectoryTab />}
        {activeTab === 'enrollments' && <EnrollmentsTab />}
        {activeTab === 'expiring' && <ExpiringTab />}
      </div>
    </div>
  );
}
