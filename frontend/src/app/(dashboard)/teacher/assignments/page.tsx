'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  Edit3,
  Award,
  AlertCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Trash2,
  Search,
  Eye,
  BarChart3,
  BookOpen,
  Users,
  CalendarDays,
  ExternalLink,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData, clientCache } from '@/lib/cache';
import { CardGridSkeleton } from '@/components/ui/card-grid-skeleton';
import { Modal } from '@/components/ui/modal';
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';

interface LessonOption {
  id: string;
  title: string;
  unitTitle: string;
  courseId: string;
  courseTitle: string;
  level: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  skillType?: string;
  lessonId?: string;
  createdAt: string;
  lesson?: { title: string };
  course?: {
    id: string;
    title: string;
    level: string;
  };
  _count?: {
    submissions: number;
    graded: number;
  };
}

interface Submission {
  id: string;
  content: string;
  fileUrl?: string;
  score?: number;
  feedback?: string;
  status: 'SUBMITTED' | 'GRADED';
  submittedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

const SKILL_CATEGORIES = [
  'WRITING', 'SPEAKING', 'READING', 'LISTENING', 'GRAMMAR', 'VOCABULARY', 'PRONUNCIATION'
];

const SKILL_COLORS: Record<string, string> = {
  WRITING: 'indigo',
  SPEAKING: 'success',
  READING: 'default',
  LISTENING: 'warning',
  GRAMMAR: 'secondary',
  VOCABULARY: 'purple',
  PRONUNCIATION: 'outline',
};

export default function TeacherAssignmentsPage() {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

  const [gradeForm, setGradeForm] = useState({ score: 0, feedback: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const {
    data: pageData,
    loading,
    refresh: fetchAssignments,
  } = useCachedData<{ assignments: Assignment[] }>(
    'teacher_assignments_page',
    async () => {
      const assRes = await apiClient.get<{ assignments: Assignment[] }>('/teacher/assignments');
      const assignments: Assignment[] =
        (assRes as any)?.assignments ||
        (Array.isArray(assRes) ? assRes : []);
      return { assignments };
    },
    { ttl: 300_000, revalidateOnFocus: false, initialData: { assignments: [] } }
  );

  const assignments = pageData?.assignments || [];

  // Fetch submissions when viewing an assignment
  const {
    data: rawSubmissions,
    loading: submissionsLoading,
    refresh: refreshSubmissions,
  } = useCachedData<Submission[]>(
    viewingAssignment ? `teacher_assignment_subs_${viewingAssignment.id}` : null,
    async () => {
      if (!viewingAssignment) return [];
      const res = await apiClient.get<Submission[]>(
        `/teacher/assignments/${viewingAssignment.id}/submissions`
      );
      return Array.isArray(res) ? res : (res as any)?.data || (res as any)?.submissions || [];
    },
    { ttl: 60_000, initialData: [] }
  );

  const submissions = rawSubmissions || [];

  // Filter assignments
  const filtered = assignments.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.skillType?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      setDeletingId(assignmentToDelete.id);
      await apiClient.delete(`/teacher/assignments/${assignmentToDelete.id}`);
      clientCache.invalidate('teacher_assignments');
      fetchAssignments();
      setAssignmentToDelete(null);
      showToast('success', 'Assignment deleted successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete assignment.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      setActionLoading(true);
      await apiClient.post(`/teacher/submissions/${gradingSubmission.id}/grade`, gradeForm);
      showToast('success', 'Grade submitted and student notified!');
      setGradingSubmission(null);
      clientCache.invalidate(`teacher_assignment_subs_${viewingAssignment?.id}`);
      refreshSubmissions();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to grade submission.');
    } finally {
      setActionLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Assignment Management Studio
          </h1>
          <p className="text-xs text-slate-500">
            Create 7-skill English assignments, review student submissions, and deliver teacher evaluations.
          </p>
        </div>
        <Link href="/teacher/assignments/create">
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-1.5" /> Create Assignment
          </Button>
        </Link>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-medium border ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search assignments by title, course, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Assignment Cards Grid */}
      {loading ? (
        <CardGridSkeleton count={3} columns="3" />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {search ? 'No Assignments Found' : 'No Assignments Created Yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'Try a different search term or clear the filter.'
              : 'Design writing, speaking, and grammar assignments for your students and start evaluating their English skills.'}
          </p>
          {!search && (
            <div className="pt-2">
              <Link href="/teacher/assignments/create">
                <Button variant="gradient" size="sm">
                  <Plus className="h-4 w-4 mr-1.5" /> Create First Assignment
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((assignment) => {
            const subCount = assignment._count?.submissions || 0;
            const gradedCount = assignment._count?.graded || 0;
            const pendingCount = subCount - gradedCount;
            const overdue = isOverdue(assignment.dueDate);

            return (
              <Card
                key={assignment.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all"
              >
                <div className="space-y-2">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={(SKILL_COLORS[assignment.skillType || ''] as any) || 'outline'}
                      className="text-[10px]"
                    >
                      {assignment.skillType || 'SKILL'}
                    </Badge>
                    <Badge
                      variant={overdue ? 'destructive' : 'outline'}
                      className="text-[10px]"
                    >
                      {overdue ? 'Overdue' : `Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                    {assignment.title}
                  </h3>

                  {/* Course & Lesson */}
                  <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-primary-500" />
                    {assignment.course?.title || 'Course'} • {assignment.lesson?.title || 'Lesson'}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400">Max Score</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{assignment.maxScore}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400">Submitted</p>
                      <p className="font-bold text-primary-600">{subCount}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400">Pending</p>
                      <p className={`font-bold ${pendingCount > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {pendingCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 px-2.5 font-medium border-slate-200 dark:border-slate-700"
                      onClick={() => setViewingAssignment(assignment)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1 text-primary-600" /> View
                    </Button>
                    {pendingCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 px-2 text-amber-600 dark:text-amber-400"
                        onClick={() => setViewingAssignment(assignment)}
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" /> Grade ({pendingCount})
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    onClick={() => setAssignmentToDelete(assignment)}
                    title="Delete Assignment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────── */}
      {assignmentToDelete && (
        <Modal
          isOpen={Boolean(assignmentToDelete)}
          onClose={() => setAssignmentToDelete(null)}
          size="sm"
          title="Delete Assignment?"
          description="All student submissions will also be removed. This action cannot be undone."
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setAssignmentToDelete(null)}
                disabled={deletingId === assignmentToDelete.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={handleDelete}
                isLoading={deletingId === assignmentToDelete.id}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Assignment
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-900 dark:bg-rose-950/30">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-rose-500" />
              <div className="text-xs text-rose-700 dark:text-rose-300">
                This will permanently delete
                <span className="font-bold"> “{assignmentToDelete.title}”</span> and remove
                <span className="font-bold">
                  {' '}
                  {assignmentToDelete._count?.submissions || 0} submission
                  {(assignmentToDelete._count?.submissions || 0) === 1 ? '' : 's'}
                </span>{' '}
                from your students. This action cannot be reversed.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── VIEW ASSIGNMENT MODAL ─────────────────────────────── */}
      {viewingAssignment && (
        <Modal
          isOpen={Boolean(viewingAssignment)}
          onClose={() => {
            setViewingAssignment(null);
            setGradingSubmission(null);
          }}
          size="full"
          title={
            <div className="flex items-center gap-2">
              <Badge
                variant={(SKILL_COLORS[viewingAssignment.skillType || ''] as any) || 'outline'}
                className="text-xs"
              >
                {viewingAssignment.skillType || 'SKILL'}
              </Badge>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {viewingAssignment.title}
              </span>
              {isOverdue(viewingAssignment.dueDate) && (
                <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
              )}
            </div>
          }
          description={
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <BookOpen className="h-3.5 w-3.5 text-primary-500" />
              <span>{viewingAssignment.course?.title || 'Course'}</span>
              <span>•</span>
              <span>{viewingAssignment.lesson?.title || 'Lesson'}</span>
              <span>•</span>
              <CalendarDays className="h-3 w-3" />
              <span>Due {new Date(viewingAssignment.dueDate).toLocaleDateString()}</span>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500 font-medium">
                Max Score: <span className="text-slate-800 dark:text-slate-200 font-bold">{viewingAssignment.maxScore} pts</span>
              </div>
              <Button
                variant="default"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setViewingAssignment(null);
                  setGradingSubmission(null);
                }}
              >
                Done
              </Button>
            </div>
          }
        >
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Quick metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Max Score</p>
                <p className="font-black text-slate-900 dark:text-white text-base mt-0.5">
                  {viewingAssignment.maxScore}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Submissions</p>
                <p className="font-black text-primary-600 text-base mt-0.5">
                  {submissionsLoading ? '...' : submissions.length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Graded</p>
                <p className="font-black text-emerald-600 text-base mt-0.5">
                  {submissionsLoading ? '...' : submissions.filter((s) => s.status === 'GRADED').length}
                </p>
              </div>
            </div>

            {/* Assignment instructions */}
            {viewingAssignment.description && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                  <ClipboardList className="h-3.5 w-3.5 text-primary-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Assignment Instructions &amp; Rubric
                  </span>
                </div>
                <div className="p-4 max-h-72 overflow-y-auto bg-white dark:bg-slate-950">
                  <RichTextRenderer content={viewingAssignment.description} />
                </div>
              </div>
            )}

            {/* Submissions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary-600" />
                Student Submissions ({submissions.length}):
              </h4>

              {submissionsLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="py-8 text-center border-dashed border rounded-xl text-xs text-slate-400">
                  No student submissions received yet.
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3"
                  >
                    {/* Student header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {sub.student.firstName} {sub.student.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {sub.student.email} • Submitted {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.status === 'GRADED' ? (
                          <Badge variant="success" className="text-[10px]">
                            {sub.score} / {viewingAssignment.maxScore} pts
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">Needs Grading</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2.5"
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGradeForm({
                              score: sub.score ?? viewingAssignment.maxScore,
                              feedback: sub.feedback || '',
                            });
                          }}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade Work'}
                        </Button>
                      </div>
                    </div>

                    {/* Student answer */}
                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50 max-h-32 overflow-y-auto">
                      <RichTextRenderer content={sub.content} />
                    </div>

                    {/* Existing feedback */}
                    {sub.feedback && (
                      <div className="rounded-lg bg-emerald-50/50 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                        <strong className="block mb-1 text-[10px] uppercase tracking-wider">
                          ✅ Teacher Feedback:
                        </strong>
                        <RichTextRenderer content={sub.feedback} />
                      </div>
                    )}

                    {/* Inline grading panel */}
                    {gradingSubmission?.id === sub.id && (
                      <form
                        onSubmit={handleGradeSubmission}
                        className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3"
                      >
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-primary-600" />
                          Evaluation Panel — {sub.student.firstName} {sub.student.lastName}
                        </p>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Score (out of {viewingAssignment.maxScore})
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={viewingAssignment.maxScore}
                            required
                            value={gradeForm.score}
                            onChange={(e) =>
                              setGradeForm({ ...gradeForm, score: parseInt(e.target.value) || 0 })
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                          />
                        </div>
                        <RichTextEditor
                          label="Constructive Feedback, Rubric Notes & Corrections"
                          placeholder="Praise strengths and identify specific grammar/vocabulary improvements..."
                          value={gradeForm.feedback}
                          onChange={(val) => setGradeForm({ ...gradeForm, feedback: val })}
                          minRows={3}
                          category="feedback"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setGradingSubmission(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="gradient"
                            size="sm"
                            className="text-xs"
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Saving...' : 'Submit Evaluation'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
