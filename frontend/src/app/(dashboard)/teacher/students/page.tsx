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
  CalendarPlus,
  Shield,
  Filter,
  RefreshCw,
  Sparkles,
  CalendarCheck,
  ShieldAlert,
  BookOpen,
  Send,
  MessageSquare,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  UserX,
  Layers,
  ChevronDown,
  UserPlus,
} from 'lucide-react';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ApplicationsTab } from '@/components/teacher/applications-tab';
import { DirectAdmissionModal } from '@/components/teacher/direct-admission-modal';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnrolledStudent {
  id: string; // enrollmentId
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
    studentProfile?: { id?: string; currentLevel: string; targetLevel: string };
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
  if (days <= 3) return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
  if (days <= 7) return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
  return 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AvatarCircle({ first, last, size = 'md' }: { first: string; last: string; size?: 'sm' | 'md' | 'lg' }) {
  const gradients = [
    'from-[#315b36] to-[#1e3c23]',
    'from-indigo-600 to-violet-700',
    'from-sky-600 to-blue-700',
    'from-amber-600 to-orange-700',
    'from-rose-600 to-pink-700',
    'from-teal-600 to-emerald-700',
  ];
  const idx = Math.abs((first?.charCodeAt(0) || 0) + (last?.charCodeAt(0) || 0)) % gradients.length;
  const dim = size === 'sm' ? 'h-8 w-8 text-[11px]' : size === 'lg' ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-xs';

  return (
    <div className={`${dim} flex items-center justify-center rounded-xl bg-gradient-to-br ${gradients[idx]} text-white font-black shrink-0 shadow-xs select-none`}>
      {avatarInitials(first, last)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; dot: string; text: string }> = {
    ACTIVE: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
      text: 'Active',
    },
    SUSPENDED: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
      text: 'Suspended',
    },
    EXPIRED: {
      bg: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      dot: 'bg-slate-400',
      text: 'Expired',
    },
    PENDING: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
      dot: 'bg-sky-500',
      text: 'Pending',
    },
    COMPLETED: {
      bg: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
      dot: 'bg-violet-500',
      text: 'Completed',
    },
  };

  const conf = map[status] || {
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    text: status,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${conf.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
      {conf.text}
    </span>
  );
}

function Toast({ msg }: { msg: { type: 'success' | 'error'; text: string } }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 ${
        msg.type === 'success'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-800'
          : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-800'
      }`}
    >
      {msg.type === 'success' ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
      )}
      <span>{msg.text}</span>
    </div>
  );
}

// ─── Modal: Quick Coaching Note ──────────────────────────────────────────────

interface CoachingModalProps {
  student: { id: string; firstName: string; lastName: string; email: string } | null;
  onClose: () => void;
  onSuccess: (name: string) => void;
  prefillTitle?: string;
  prefillContent?: string;
}

function CoachingNoteModal({ student, onClose, onSuccess, prefillTitle, prefillContent }: CoachingModalProps) {
  const [title, setTitle] = useState(prefillTitle || 'Instructor Coaching Note');
  const [content, setContent] = useState(prefillContent || '');
  const [strengths, setStrengths] = useState('Consistent progress, active engagement');
  const [improvements, setImprovements] = useState('Review recent vocabulary and practice speaking prompts');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide feedback content for the student.');
      return;
    }
    try {
      setSending(true);
      setError(null);
      await apiClient.post(`/teacher/students/${student.id}/feedback`, {
        title,
        content,
        strengths: strengths.split(',').map((s) => s.trim()).filter(Boolean),
        improvements: improvements.split(',').map((s) => s.trim()).filter(Boolean),
      });
      clientCache.invalidate('teacher_');
      onSuccess(`${student.firstName} ${student.lastName}`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch coaching note.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Coaching Feedback — ${student.firstName} ${student.lastName}`}
      description="Send direct pedagogical guidance, progress recognition, or homework tips to this student's portal."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50 flex items-center gap-3">
          <AvatarCircle first={student.firstName} last={student.lastName} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Note Subject / Topic</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Speaking Milestone Review"
            className="text-xs font-semibold"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Coaching Guidance &amp; Observations</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write constructive, actionable remarks..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs resize-none focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Key Strengths (comma-separated)</label>
          <Input
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="e.g. Good pronunciation, fluent speech"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Recommended Focus Areas (comma-separated)</label>
          <Input
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="e.g. Tense consistency, preposition drills"
            className="text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={sending} className="text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={sending}
            className="text-xs bg-[#315b36] hover:bg-[#254629] text-white font-bold gap-1.5"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>{sending ? 'Sending...' : 'Send Coaching Note'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal: Custom Extension Modal ───────────────────────────────────────────

interface ExtensionModalProps {
  enrollmentId: string | null;
  studentName: string;
  currentExpiresAt?: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function ExtensionModal({ enrollmentId, studentName, currentExpiresAt, onClose, onSuccess }: ExtensionModalProps) {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [customDays, setCustomDays] = useState<string>('30');
  const [reason, setReason] = useState('Instructor granted study window extension');
  const [extending, setExtending] = useState(false);

  if (!enrollmentId) return null;

  const presets = [7, 14, 30, 60, 90];

  const handlePreset = (days: number) => {
    setSelectedDays(days);
    setCustomDays(String(days));
  };

  const handleCustomChange = (val: string) => {
    setCustomDays(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedDays(parsed);
    }
  };

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    const daysToGrant = parseInt(customDays, 10);
    if (isNaN(daysToGrant) || daysToGrant <= 0) return;

    try {
      setExtending(true);
      await apiClient.post(`/teacher/enrollments/${enrollmentId}/extend`, {
        extensionDays: daysToGrant,
        reason,
      });
      clientCache.invalidate('teacher_');
      onSuccess(`Granted +${daysToGrant} days access to ${studentName}.`);
      onClose();
    } catch {
      alert('Failed to extend enrollment. Please try again.');
    } finally {
      setExtending(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Extend Access — ${studentName}`}
      description="Grant additional curriculum study time with flexible presets or a custom day window."
      size="sm"
    >
      <form onSubmit={handleExtend} className="space-y-4 pt-1">
        {currentExpiresAt && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">Current Access Expiration:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {new Date(currentExpiresAt).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Duration Presets</label>
          <div className="grid grid-cols-5 gap-1.5">
            {presets.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => handlePreset(p)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                  selectedDays === p && customDays === String(p)
                    ? 'bg-[#315b36] text-white border-[#315b36] shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                +{p}d
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Custom Days to Add</label>
          <Input
            type="number"
            min={1}
            max={365}
            value={customDays}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="text-xs font-bold"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reason / Memo (Optional)</label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Tuition fee confirmed, academic dispensation..."
            className="text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={extending} className="text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={extending}
            className="text-xs bg-[#315b36] hover:bg-[#254629] text-white font-bold gap-1.5"
          >
            {extending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Extending...</span>
              </>
            ) : (
              <>
                <CalendarPlus className="h-3.5 w-3.5" />
                <span>Grant +{customDays} Days</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal: Bulk Assign Cohort ────────────────────────────────────────────────

interface BulkCohortModalProps {
  selectedIds: string[];
  teacherClasses: TeacherClass[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}

function BulkCohortModal({ selectedIds, teacherClasses, onClose, onSuccess }: BulkCohortModalProps) {
  const [classId, setClassId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await Promise.all(
        selectedIds.map((id) =>
          apiClient.patch(`/teacher/students/${id}`, {
            classId: classId || null,
          })
        )
      );
      clientCache.invalidate('teacher_');
      onSuccess(selectedIds.length);
      onClose();
    } catch {
      alert('Failed to reassign some cohorts. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Bulk Assign Cohort / Class"
      description={`Reassign ${selectedIds.length} selected learners to a new live class cohort or set to self-paced.`}
      size="sm"
    >
      <form onSubmit={handleBulkAssign} className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Cohort / Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="">None (Self-paced study)</option>
            {teacherClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving} className="text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            className="text-xs bg-[#315b36] hover:bg-[#254629] text-white font-bold gap-1.5"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
            <span>Apply to {selectedIds.length} Learners</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Tab: Directory ───────────────────────────────────────────────────────────

function DirectoryTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action states
  const [editingStudent, setEditingStudent] = useState<EnrolledStudent | null>(null);
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editClassId, setEditClassId] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editCurrentLevel, setEditCurrentLevel] = useState('A1');
  const [editTargetLevel, setEditTargetLevel] = useState('B2');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingStudent, setDeletingStudent] = useState<EnrolledStudent | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modals
  const [coachingStudent, setCoachingStudent] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [extendingEnrollment, setExtendingEnrollment] = useState<{ id: string; name: string; expiresAt?: string } | null>(null);
  const [bulkCohortOpen, setBulkCohortOpen] = useState(false);
  const [inlineActionId, setInlineActionId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

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
    apiClient
      .get<any>('/teacher/classes')
      .then((res) => {
        setTeacherClasses((res as any)?.classes || (res as any)?.data || (Array.isArray(res) ? res : []));
      })
      .catch(() => {});
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

  const allStudents = rawStudents || [];

  // Local filtering
  const filteredStudents = useMemo(() => {
    return allStudents.filter((st) => {
      if (statusFilter !== 'ALL' && st.status !== statusFilter) return false;
      if (classFilter !== 'ALL') {
        if (classFilter === 'SELF_PACED' && st.classId) return false;
        if (classFilter !== 'SELF_PACED' && st.classId !== classFilter) return false;
      }
      return true;
    });
  }, [allStudents, statusFilter, classFilter]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Bulk Actions
  const handleBulkExtend30 = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkLoading(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          apiClient.post(`/teacher/enrollments/${id}/extend`, {
            extensionDays: 30,
            reason: 'Bulk 30-day instructor extension',
          })
        )
      );
      clientCache.invalidate('teacher_');
      await refresh();
      showToast('success', `Successfully granted +30 days to ${selectedIds.size} learners.`);
      setSelectedIds(new Set());
    } catch {
      showToast('error', 'Bulk extension encountered an error.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkToggleStatus = async (targetStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (selectedIds.size === 0) return;
    try {
      setBulkLoading(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          apiClient.patch(`/teacher/students/${id}`, { status: targetStatus })
        )
      );
      clientCache.invalidate('teacher_');
      await refresh();
      showToast('success', `Updated ${selectedIds.size} learners to ${targetStatus}.`);
      setSelectedIds(new Set());
    } catch {
      showToast('error', 'Failed to update student statuses.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Quick 1-click +30 Days
  const quickExtendSingle = async (st: EnrolledStudent) => {
    try {
      setInlineActionId(st.id);
      await apiClient.post(`/teacher/enrollments/${st.id}/extend`, {
        extensionDays: 30,
        reason: 'Single-click +30d grant from directory action bar',
      });
      clientCache.invalidate('teacher_');
      await refresh();
      showToast('success', `Added +30 days access to ${st.user.firstName}.`);
    } catch {
      showToast('error', 'Failed to extend access.');
    } finally {
      setInlineActionId(null);
    }
  };

  // Quick Status Toggle
  const quickToggle = async (st: EnrolledStudent, next: 'ACTIVE' | 'SUSPENDED') => {
    try {
      setInlineActionId(st.id);
      await apiClient.patch(`/teacher/students/${st.id}`, { status: next });
      clientCache.invalidate('teacher_');
      await refresh();
      showToast('success', next === 'ACTIVE' ? `${st.user.firstName} reactivated.` : `${st.user.firstName} suspended.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update status.');
    } finally {
      setInlineActionId(null);
    }
  };

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
      clientCache.invalidate('teacher_');
      await refresh();
      setEditingStudent(null);
      showToast('success', `${editingStudent.user.firstName}'s enrollment updated successfully.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update enrollment.');
    } finally {
      setSavingEdit(false);
    }
  };

  const doDelete = async () => {
    if (!deletingStudent) return;
    try {
      setDeleting(true);
      await apiClient.delete(`/teacher/students/${deletingStudent.id}`);
      clientCache.invalidate('teacher_');
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
    PRE_A1: 'Pre-A1 Starter',
    A1: 'A1 Beginner',
    A2: 'A2 Elementary',
    B1: 'B1 Intermediate',
    B2: 'B2 Upper Intermediate',
    C1: 'C1 Advanced',
    C2: 'C2 Mastery',
  };

  const isAllSelected = filteredStudents.length > 0 && selectedIds.size === filteredStudents.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < filteredStudents.length;

  return (
    <div className="space-y-4">
      {/* ─── Search & Smart Filters Bar ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#315b36] focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-900 text-[#315b36] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Suspended'}
            </button>
          ))}
        </div>

        {/* Cohort / Class Dropdown Filter */}
        {teacherClasses.length > 0 && (
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 shrink-0"
          >
            <option value="ALL">All Cohorts &amp; Classes</option>
            <option value="SELF_PACED">Self-paced (No Cohort)</option>
            {teacherClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-9 border-slate-200 dark:border-slate-800 shrink-0 font-bold"
          onClick={() => refresh()}
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* ─── Bulk Action Bar ─────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#1b351e] to-emerald-950 text-white shadow-lg border border-emerald-500/30 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 min-w-[24px] px-2 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-black">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-emerald-100">
              {selectedIds.size === 1 ? '1 learner selected' : `${selectedIds.size} learners selected`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={handleBulkExtend30}
              disabled={bulkLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-8 gap-1.5 shadow-xs"
            >
              {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarPlus className="h-3.5 w-3.5" />}
              <span>Bulk +30 Days</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkCohortOpen(true)}
              disabled={bulkLoading}
              className="border-emerald-400/40 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/60 text-xs font-bold h-8 gap-1.5"
            >
              <Layers className="h-3.5 w-3.5 text-emerald-300" />
              <span>Assign Cohort</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleStatus('ACTIVE')}
              disabled={bulkLoading}
              className="border-emerald-400/40 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/60 text-xs font-bold h-8 gap-1.5"
            >
              <PlayCircle className="h-3.5 w-3.5 text-emerald-300" />
              <span>Activate</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleStatus('SUSPENDED')}
              disabled={bulkLoading}
              className="border-amber-400/40 bg-amber-950/40 text-amber-200 hover:bg-amber-900/60 text-xs font-bold h-8 gap-1.5"
            >
              <PauseCircle className="h-3.5 w-3.5 text-amber-300" />
              <span>Suspend</span>
            </Button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Students Table Container ─────────────────────────────────────── */}
      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Users className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No students match your filter</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or clearing your search term.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400">
                <th className="w-10 px-4 py-3.5 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-[#315b36]" />
                    ) : isPartiallySelected ? (
                      <MinusSquare className="h-4 w-4 text-[#315b36]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Learner Details</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Course &amp; Level</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Cohort / Class</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Enrolled On</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredStudents.map((st) => {
                const isSelected = selectedIds.has(st.id);
                const isItemLoading = inlineActionId === st.id;

                return (
                  <tr
                    key={st.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    {/* Checkbox column */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => toggleSelectOne(st.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#315b36]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* Learner Details */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <AvatarCircle first={st.user.firstName} last={st.user.lastName} />
                        <div className="min-w-0">
                          <Link
                            href={`/teacher/students/${st.studentId || st.user.id}`}
                            className="font-bold text-slate-900 dark:text-white leading-tight truncate hover:text-[#315b36] hover:underline flex items-center gap-1 group"
                          >
                            <span>{st.user.firstName} {st.user.lastName}</span>
                          </Link>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{st.user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Course & Level */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {st.course.title}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-[#315b36] dark:bg-emerald-950/60 dark:text-emerald-300 rounded-md border border-emerald-200/80 dark:border-emerald-800">
                        {st.course.level}
                      </span>
                    </td>

                    {/* Cohort / Class */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {st.class?.name ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3 text-slate-400" />
                          {st.class.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Self-paced</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={st.status} />
                    </td>

                    {/* Enrolled On */}
                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                      {new Date(st.enrolledAt).toLocaleDateString()}
                    </td>

                    {/* ─── Refined Quick Action Buttons ────────────────────── */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="relative inline-flex items-center gap-1 justify-end">
                        {/* 1. View Portfolio Profile */}
                        <Link href={`/teacher/students/${st.studentId || st.user.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg text-slate-600 hover:text-[#315b36] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="View student portfolio & assessment record"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        {/* 2. Direct Coaching Note */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg text-slate-600 hover:text-[#315b36] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          onClick={() =>
                            setCoachingStudent({
                              id: st.studentId || st.user.id,
                              firstName: st.user.firstName,
                              lastName: st.user.lastName,
                              email: st.user.email,
                            })
                          }
                          title="Send coaching note / feedback"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>

                        {/* 3. Quick Edit Enrollment */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => openEdit(st)}
                          title="Edit enrollment & cohort"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>

                        {/* 4. Quick +30 Days Access */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 rounded-lg text-[11px] font-bold text-emerald-700 border-emerald-200/80 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40 gap-1"
                          onClick={() => quickExtendSingle(st)}
                          disabled={isItemLoading}
                          title="Grant 30 extra days of access"
                        >
                          {isItemLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CalendarDays className="h-3 w-3" />
                              <span>+30d</span>
                            </>
                          )}
                        </Button>

                        {/* 5. Quick Status Toggle */}
                        {st.status === 'ACTIVE' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            onClick={() => quickToggle(st, 'SUSPENDED')}
                            disabled={isItemLoading}
                            title="Suspend student access"
                          >
                            <PauseCircle className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            onClick={() => quickToggle(st, 'ACTIVE')}
                            disabled={isItemLoading}
                            title="Reactivate student access"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* 6. More Options Dropdown */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === st.id ? null : st.id);
                          }}
                          title="More options"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>

                        {openMenuId === st.id && (
                          <div
                            className="absolute right-0 top-9 z-30 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setExtendingEnrollment({
                                  id: st.id,
                                  name: `${st.user.firstName} ${st.user.lastName}`,
                                  expiresAt: st.expiresAt,
                                });
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <CalendarPlus className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Custom Extension...</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setCoachingStudent({
                                  id: st.studentId || st.user.id,
                                  firstName: st.user.firstName,
                                  lastName: st.user.lastName,
                                  email: st.user.email,
                                });
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Send Coaching Note</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                openEdit(st);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                              <span>Edit Full Enrollment</span>
                            </button>

                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeletingStudent(st);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Unenroll Student</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Edit Modal ───────────────────────────────────────────────────── */}
      {editingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setEditingStudent(null)}
          title={`Edit Enrollment — ${editingStudent.user.firstName} ${editingStudent.user.lastName}`}
          description="Update cohort assignment, access timeline, and CEFR level benchmarks."
        >
          <form onSubmit={saveEdit} className="space-y-4 pt-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs font-black text-slate-900 dark:text-white">
                {editingStudent.user.firstName} {editingStudent.user.lastName}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{editingStudent.user.email}</p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-[#315b36] border border-emerald-200 rounded-md">
                  {editingStudent.course.level}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {editingStudent.course.title}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enrollment Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
              >
                {['ACTIVE', 'SUSPENDED', 'EXPIRED', 'COMPLETED'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Cohort / Class</label>
              <select
                value={editClassId}
                onChange={(e) => setEditClassId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="">None (Self-paced)</option>
                {teacherClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Access Expiration Date</label>
              <Input
                type="date"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                className="text-xs font-semibold"
              />
              <p className="text-[10px] text-slate-400">Leave blank for unlimited course access.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Current CEFR Level</label>
                <select
                  value={editCurrentLevel}
                  onChange={(e) => setEditCurrentLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target CEFR Level</label>
                <select
                  value={editTargetLevel}
                  onChange={(e) => setEditTargetLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                >
                  {LEVELS.filter((l) => l !== 'PRE_A1').map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingStudent(null)}
                disabled={savingEdit}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingEdit}
                className="text-xs bg-[#315b36] hover:bg-[#254629] text-white font-bold"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Delete Confirm Modal ─────────────────────────────────────────── */}
      {deletingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingStudent(null)}
          title="Unenroll Student"
          size="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to unenroll{' '}
              <strong className="text-slate-900 dark:text-white">
                {deletingStudent.user.firstName} {deletingStudent.user.lastName}
              </strong>{' '}
              from{' '}
              <strong className="text-slate-900 dark:text-white">{deletingStudent.course.title}</strong>?
            </p>

            <div className="text-[11px] text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                This will immediately revoke their access to lessons, assignments, and live cohorts in this course.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingStudent(null)}
                disabled={deleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={doDelete}
                disabled={deleting}
                className="text-xs font-bold"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Unenrolling...
                  </>
                ) : (
                  'Confirm Unenroll'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Custom Extension Modal ──────────────────────────────────────── */}
      {extendingEnrollment && (
        <ExtensionModal
          enrollmentId={extendingEnrollment.id}
          studentName={extendingEnrollment.name}
          currentExpiresAt={extendingEnrollment.expiresAt}
          onClose={() => setExtendingEnrollment(null)}
          onSuccess={(msg) => {
            refresh();
            showToast('success', msg);
          }}
        />
      )}

      {/* ─── Coaching Note Modal ─────────────────────────────────────────── */}
      {coachingStudent && (
        <CoachingNoteModal
          student={coachingStudent}
          onClose={() => setCoachingStudent(null)}
          onSuccess={(name) => showToast('success', `Coaching note delivered to ${name}.`)}
        />
      )}

      {/* ─── Bulk Cohort Modal ───────────────────────────────────────────── */}
      {bulkCohortOpen && (
        <BulkCohortModal
          selectedIds={Array.from(selectedIds)}
          teacherClasses={teacherClasses}
          onClose={() => setBulkCohortOpen(false)}
          onSuccess={(cnt) => {
            refresh();
            setSelectedIds(new Set());
            showToast('success', `Reassigned cohort for ${cnt} learners.`);
          }}
        />
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
  const [customExtension, setCustomExtension] = useState<{ id: string; name: string; expiresAt?: string } | null>(null);
  const [coachingStudent, setCoachingStudent] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);

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

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      const matchStatus = filterStatus === 'ALL' || e.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        e.student.user.firstName.toLowerCase().includes(q) ||
        e.student.user.lastName.toLowerCase().includes(q) ||
        e.course.title.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [enrollments, filterStatus, search]);

  const doExtend = async (id: string) => {
    try {
      setExtendingId(id);
      await apiClient.post(`/teacher/enrollments/${id}/extend`, {
        extensionDays: 30,
        reason: 'Instructor grant from Enrollments manager',
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

  const doReactivate = async (id: string, name: string) => {
    try {
      setExtendingId(id);
      await apiClient.patch(`/teacher/students/${id}`, { status: 'ACTIVE' });
      clientCache.invalidate('teacher_');
      refresh();
      showToast('success', `${name} reactivated.`);
    } catch {
      showToast('error', 'Failed to reactivate enrollment.');
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
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          {statusFilters.map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-white dark:bg-slate-900 text-[#315b36] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#315b36] focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-9 border-slate-200 dark:border-slate-800 shrink-0 font-bold"
          onClick={() => refresh()}
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Refresh</span>
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          No enrollments match the filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Student</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Course &amp; Level</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Enrolled On</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Access Expiry</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <AvatarCircle first={item.student.user.firstName} last={item.student.user.lastName} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/teacher/students/${item.student.id}`}
                          className="font-bold text-slate-900 dark:text-white truncate hover:text-[#315b36] hover:underline"
                        >
                          {item.student.user.firstName} {item.student.user.lastName}
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate">{item.student.user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.course.title}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-[#315b36] dark:bg-emerald-950/60 dark:text-emerald-300 rounded-md border border-emerald-200/80 dark:border-emerald-800">
                      {item.course.level}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-slate-500 font-medium">
                    {new Date(item.enrolledAt).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-3.5 font-medium">
                    {item.expiresAt ? (
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(item.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unlimited</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* ─── Actions in Enrollments ──────────────────────────── */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/teacher/students/${item.student.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 w-8 p-0 text-slate-500 hover:text-[#315b36] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="View portfolio"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 w-8 p-0 text-slate-500 hover:text-[#315b36] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        onClick={() =>
                          setCoachingStudent({
                            id: item.student.id,
                            firstName: item.student.user.firstName,
                            lastName: item.student.user.lastName,
                            email: item.student.user.email,
                          })
                        }
                        title="Send coaching note"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>

                      {/* 1-click +30d */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-2 gap-1 font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                        onClick={() => doExtend(item.id)}
                        disabled={extendingId === item.id}
                        title="Quick extend access by 30 days"
                      >
                        {extendingId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>+30d</span>
                          </>
                        )}
                      </Button>

                      {/* Custom Extend */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 w-8 p-0 font-bold border-slate-200 hover:bg-slate-100 dark:border-slate-800"
                        onClick={() =>
                          setCustomExtension({
                            id: item.id,
                            name: `${item.student.user.firstName} ${item.student.user.lastName}`,
                            expiresAt: item.expiresAt,
                          })
                        }
                        title="Choose custom duration..."
                      >
                        <CalendarPlus className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                      </Button>

                      {/* Status Toggle: Suspend vs Reactivate */}
                      {item.status === 'ACTIVE' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 w-8 p-0 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold"
                          onClick={() => {
                            setSuspendId(item.id);
                            setSuspendReason('');
                          }}
                          title="Suspend access"
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold"
                          onClick={() =>
                            doReactivate(item.id, `${item.student.user.firstName} ${item.student.user.lastName}`)
                          }
                          disabled={extendingId === item.id}
                          title="Reactivate access"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
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

      {suspendId && (
        <Modal isOpen={true} onClose={() => setSuspendId(null)} title="Suspend Enrollment Access" size="sm">
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500">
              Provide a rationale for suspending this student&apos;s active course access.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Suspension Reason</label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Payment receipt clarification needed, academic pause..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs resize-none focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setSuspendId(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={doSuspend}
                disabled={suspending || !suspendReason.trim()}
                className="text-xs font-bold"
              >
                {suspending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    Suspending...
                  </>
                ) : (
                  'Confirm Suspend'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {customExtension && (
        <ExtensionModal
          enrollmentId={customExtension.id}
          studentName={customExtension.name}
          currentExpiresAt={customExtension.expiresAt}
          onClose={() => setCustomExtension(null)}
          onSuccess={(msg) => {
            refresh();
            showToast('success', msg);
          }}
        />
      )}

      {coachingStudent && (
        <CoachingNoteModal
          student={coachingStudent}
          onClose={() => setCoachingStudent(null)}
          onSuccess={(name) => showToast('success', `Coaching note delivered to ${name}.`)}
        />
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
  const [customExtension, setCustomExtension] = useState<{ id: string; name: string; expiresAt?: string } | null>(null);
  const [coachingStudent, setCoachingStudent] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);

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

  const doExtend = async (id: string, days: number = 30) => {
    try {
      setExtendingId(id);
      await apiClient.post(`/teacher/enrollments/${id}/extend`, {
        extensionDays: days,
        reason: 'Proactive instructor extension from Expiring Watchlist',
      });
      clientCache.invalidate('teacher_');
      refresh();
      showToast('success', `Access extended by ${days} days.`);
    } catch {
      showToast('error', 'Failed to extend enrollment.');
    } finally {
      setExtendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Day Window Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Expiring Window:
          </span>
          {[3, 7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setFilterDays(days)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterDays === days
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Next {days} days
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 border-slate-200 dark:border-slate-800 font-bold"
          onClick={() => refresh()}
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Refresh</span>
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Watchlist Clear!</p>
          <p className="text-xs text-slate-400 mt-1">
            No enrolled students are expiring in the next {filterDays} days.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Student</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Course &amp; Level</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Cohort</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Expiration Date</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Urgency Window</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {students.map((item) => {
                const days = daysUntil(item.expiresAt);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      days <= 3 ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <AvatarCircle first={item.student.user.firstName} last={item.student.user.lastName} size="sm" />
                        <div className="min-w-0">
                          <Link
                            href={`/teacher/students/${item.student.id}`}
                            className="font-bold text-slate-900 dark:text-white truncate hover:text-[#315b36] hover:underline"
                          >
                            {item.student.user.firstName} {item.student.user.lastName}
                          </Link>
                          <p className="text-[11px] text-slate-400 truncate">{item.student.user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{item.course.title}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-[#315b36] dark:bg-emerald-950/60 dark:text-emerald-300 rounded-md border border-emerald-200/80 dark:border-emerald-800">
                        {item.course.level}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 font-medium">
                      {item.class?.name ?? <span className="italic text-slate-400">Self-paced</span>}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {new Date(item.expiresAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border ${urgencyColor(days)}`}>
                        {days <= 0 ? 'Expires today' : `${days} days left`}
                      </span>
                    </td>

                    {/* ─── Actions in Expiring ───────────────────────────── */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/teacher/students/${item.student.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 w-8 p-0 text-slate-500 hover:text-[#315b36] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="View portfolio"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        {/* Send Expiring Reminder Note */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 w-8 p-0 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          onClick={() =>
                            setCoachingStudent({
                              id: item.student.id,
                              firstName: item.student.user.firstName,
                              lastName: item.student.user.lastName,
                              email: item.student.user.email,
                            })
                          }
                          title="Send renewal reminder coaching note"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>

                        {/* Quick 1-click +30 Days */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1.5 font-bold border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
                          onClick={() => doExtend(item.id, 30)}
                          disabled={extendingId === item.id}
                          title="Grant +30 days immediately"
                        >
                          {extendingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CalendarCheck className="h-3.5 w-3.5" />
                          )}
                          <span>+30d</span>
                        </Button>

                        {/* Custom Extension Modal */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 w-8 p-0 font-bold border-slate-200 hover:bg-slate-100 dark:border-slate-800"
                          onClick={() =>
                            setCustomExtension({
                              id: item.id,
                              name: `${item.student.user.firstName} ${item.student.user.lastName}`,
                              expiresAt: item.expiresAt,
                            })
                          }
                          title="Choose custom duration..."
                        >
                          <CalendarPlus className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
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

      {customExtension && (
        <ExtensionModal
          enrollmentId={customExtension.id}
          studentName={customExtension.name}
          currentExpiresAt={customExtension.expiresAt}
          onClose={() => setCustomExtension(null)}
          onSuccess={(msg) => {
            refresh();
            showToast('success', msg);
          }}
        />
      )}

      {coachingStudent && (
        <CoachingNoteModal
          student={coachingStudent}
          onClose={() => setCoachingStudent(null)}
          prefillTitle="Curriculum Access Renewal Reminder"
          prefillContent={`Hi ${coachingStudent.firstName}, this is a friendly reminder that your course study window is expiring soon. Please review your remaining modules or get in touch regarding renewal options.`}
          onSuccess={(name) => showToast('success', `Renewal reminder delivered to ${name}.`)}
        />
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'directory' | 'applications' | 'enrollments' | 'expiring';

export default function StudentsDirectoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('directory');
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (msg: { type: 'success' | 'error'; text: string }) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tab') as Tab;
      if (t && ['directory', 'applications', 'enrollments', 'expiring'].includes(t)) {
        setActiveTab(t);
      }
    }
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

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

  const { data: applicationsData, refresh: refreshApplications } = useCachedData<{ counts?: { pending: number } }>(
    'teacher_applications_counts',
    async () => {
      const res = await apiClient.get<any>('/teacher/applications?status=PENDING');
      return (res as any)?.data || res;
    },
    { ttl: 30000, initialData: { counts: { pending: 0 } } }
  );
  const pendingAppsCount = applicationsData?.counts?.pending || 0;

  const studentList = students || [];
  const activeCount = studentList.filter((s) => s.status === 'ACTIVE').length;
  const suspendedCount = studentList.filter((s) => s.status === 'SUSPENDED').length;
  const expiringCount = (expiring || []).length;

  const statsRibbon = [
    {
      label: 'Total Learners',
      value: studentList.length,
      sub: 'Enrolled in courses',
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      border: 'border-indigo-100 dark:border-indigo-900/50',
    },
    {
      label: 'Active Access',
      value: activeCount,
      sub: 'Currently learning',
      icon: CheckCircle2,
      color: 'text-[#315b36] dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      border: 'border-emerald-100 dark:border-emerald-900/50',
    },
    {
      label: 'Pending Apps',
      value: pendingAppsCount,
      sub: 'Awaiting admission',
      icon: GraduationCap,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      border: 'border-amber-100 dark:border-amber-900/50',
      pulse: pendingAppsCount > 0,
    },
    {
      label: 'Expiring Soon (7d)',
      value: expiringCount,
      sub: 'Requires renewal',
      icon: AlertTriangle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      border: 'border-rose-100 dark:border-rose-900/50',
      pulse: expiringCount > 0,
    },
  ];

  const TABS = [
    { id: 'directory' as Tab, label: 'All Students', icon: Users, count: studentList.length },
    { id: 'applications' as Tab, label: 'Applications & Admissions', icon: GraduationCap, count: pendingAppsCount, isAlert: pendingAppsCount > 0 },
    { id: 'enrollments' as Tab, label: 'Enrollments & Access Control', icon: UserCheck },
    { id: 'expiring' as Tab, label: 'Expiring Watchlist', icon: AlertTriangle, count: expiringCount, isAlert: expiringCount > 0 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── 1. Header Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#122416] via-[#1a3820] to-[#0e1d11] p-6 sm:p-8 text-white shadow-xl border border-emerald-500/25">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <GraduationCap className="h-3.5 w-3.5 text-emerald-300" />
                Unified Students &amp; Access Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Students Directory
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl font-normal">
              Supervise all student profiles, review admission applications, configure payment decisions, and manage CEFR course access.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <Button
              onClick={() => setIsDirectModalOpen(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-lg shadow-emerald-700/30 gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Direct Admission
            </Button>
            <Link href="/teacher/courses">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 backdrop-blur-md text-xs font-bold h-9 gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                View Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. Key Statistics Ribbon ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {statsRibbon.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`flex items-center gap-3.5 rounded-2xl border ${s.border} bg-white dark:bg-slate-900 p-4 shadow-xs transition-all hover:shadow-md`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                    {s.value}
                  </p>
                  {s.pulse && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1 truncate">
                  {s.label}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 3. Unified Segmented Tab Navigation ─────────────────────────── */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/70 rounded-2xl w-fit flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#315b36] dark:text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>

              {tab.count !== undefined && (
                <span
                  className={`flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full text-[10px] font-black ${
                    tab.isAlert
                      ? 'bg-amber-500 text-white animate-pulse'
                      : isActive
                      ? 'bg-emerald-100 text-[#315b36] dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── 4. Tab Workspace ────────────────────────────────────────────── */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'directory' && <DirectoryTab />}
        {activeTab === 'applications' && (
          <ApplicationsTab
            showToast={showToast}
            onRefreshParent={() => {
              refreshApplications();
              clientCache.invalidate('teacher_students');
            }}
          />
        )}
        {activeTab === 'enrollments' && <EnrollmentsTab />}
        {activeTab === 'expiring' && <ExpiringTab />}
      </div>

      <DirectAdmissionModal
        isOpen={isDirectModalOpen}
        onClose={() => setIsDirectModalOpen(false)}
        onSuccess={(name) => {
          showToast({ type: 'success', text: `Direct student ${name} admitted successfully.` });
          refreshApplications();
          clientCache.invalidate('teacher_students');
        }}
      />

      {toast && <Toast msg={toast} />}
    </div>
  );
}
