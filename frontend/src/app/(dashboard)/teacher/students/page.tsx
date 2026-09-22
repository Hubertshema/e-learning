'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Users,
  Search,
  BookOpen,
  Calendar,
  Mail,
  GraduationCap,
  Sparkles,
  Eye,
  MoreVertical,
  Edit3,
  Trash2,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Layers,
} from 'lucide-react';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';
import { TableSkeleton } from '@/components/ui/table-skeleton';

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
    studentProfile?: {
      currentLevel: string;
      targetLevel: string;
    };
  };
  course: {
    id: string;
    title: string;
    level: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

interface TeacherClass {
  id: string;
  name: string;
}

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<EnrolledStudent | null>(null);
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editClassId, setEditClassId] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editCurrentLevel, setEditCurrentLevel] = useState('A1');
  const [editTargetLevel, setEditTargetLevel] = useState('B2');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal State
  const [deletingStudent, setDeletingStudent] = useState<EnrolledStudent | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Teacher classes for assigning cohort
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);

  // Alert Feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch teacher classes once
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await apiClient.get<any>('/teacher/classes');
        const list = (res as any)?.classes || (res as any)?.data || (Array.isArray(res) ? res : []);
        setTeacherClasses(list);
      } catch {}
    }
    loadClasses();
  }, []);

  const {
    data: rawStudents,
    loading,
    refresh: fetchStudents
  } = useCachedData<EnrolledStudent[]>(
    `teacher_students_${search}`,
    async () => {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiClient.get<{ students: EnrolledStudent[] }>(`/teacher/students${query}`);
      const studentList: EnrolledStudent[] =
        (res as any)?.students ||
        (res as any)?.data?.students ||
        (Array.isArray(res) ? res : []);
      return studentList;
    },
    { ttl: 120_000, initialData: [] }
  );

  const students = rawStudents || [];

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEditModal = (st: EnrolledStudent) => {
    setEditingStudent(st);
    setEditStatus(st.status || 'ACTIVE');
    setEditClassId(st.classId || '');
    setEditExpiresAt(st.expiresAt ? new Date(st.expiresAt).toISOString().split('T')[0] : '');
    setEditCurrentLevel(st.user.studentProfile?.currentLevel || 'A1');
    setEditTargetLevel(st.user.studentProfile?.targetLevel || 'B2');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
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
      await fetchStudents();
      setEditingStudent(null);
      showToast('success', `Enrollment for ${editingStudent.user.firstName} updated successfully.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update student enrollment.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleQuickStatusToggle = async (st: EnrolledStudent, nextStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      await apiClient.patch(`/teacher/students/${st.id}`, {
        status: nextStatus,
      });

      clientCache.invalidate('teacher_students');
      await fetchStudents();
      showToast(
        'success',
        nextStatus === 'ACTIVE'
          ? `${st.user.firstName}'s access reactivated.`
          : `${st.user.firstName}'s access suspended.`
      );
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to change student status.');
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!deletingStudent) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/teacher/students/${deletingStudent.id}`);

      clientCache.invalidate('teacher_students');
      await fetchStudents();
      showToast('success', `${deletingStudent.user.firstName} ${deletingStudent.user.lastName} was unenrolled.`);
      setDeletingStudent(null);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to unenroll student.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold shadow-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Student Directory</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Enrolled Students
          </h1>
          <p className="text-xs text-slate-500">
            View active learners across your curriculum, manage enrollments, cohorts, and skill diagnostics.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Directory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary-600" />
            Active Learners ({students.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Inspect enrolled course, assigned cohort, and 7-skill learning diagnostics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Course & Level</th>
                    <th className="pb-3 font-semibold">Assigned Cohort</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Enrolled Date</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {st.user.firstName ? st.user.firstName[0] : 'S'}
                            {st.user.lastName ? st.user.lastName[0] : ''}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {st.user.firstName} {st.user.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500">{st.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <Badge variant="indigo">{st.course.level}</Badge>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                          {st.course.title}
                        </p>
                      </td>
                      <td className="py-3.5">
                        {st.class ? (
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {st.class.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Self-paced</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        {st.status === 'ACTIVE' ? (
                          <Badge variant="success">Active</Badge>
                        ) : st.status === 'SUSPENDED' ? (
                          <Badge variant="warning">Suspended</Badge>
                        ) : (
                          <Badge variant="outline">{st.status}</Badge>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-500 text-[11px]">
                        {new Date(st.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="relative inline-flex items-center gap-1.5 justify-end">
                          {/* Eye Icon (View details) */}
                          <Link href={`/teacher/students/${st.user?.id || st.userId}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="inline-flex h-8 w-8 items-center justify-center p-0 rounded-lg text-slate-600 hover:text-primary-600 hover:border-primary-500 dark:text-slate-300 dark:hover:text-primary-400"
                              title="View student details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {/* 3 Dots Menu Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === st.id ? null : st.id);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center p-0 rounded-lg text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-300 dark:hover:text-white"
                            title="More options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>

                          {/* Dropdown Menu */}
                          {openMenuId === st.id && (
                            <div
                              className="absolute right-0 top-9 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-left animate-in fade-in zoom-in-95 duration-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenEditModal(st);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                                Edit Enrollment
                              </button>

                              {st.status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleQuickStatusToggle(st, 'SUSPENDED');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 transition-colors"
                                >
                                  <PauseCircle className="h-3.5 w-3.5" />
                                  Suspend Access
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleQuickStatusToggle(st, 'ACTIVE');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 transition-colors"
                                >
                                  <PlayCircle className="h-3.5 w-3.5" />
                                  Reactivate Access
                                </button>
                              )}

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDeletingStudent(st);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Unenroll Student
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
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No students found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Student Enrollment Modal */}
      {editingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setEditingStudent(null)}
          title={`Edit Enrollment — ${editingStudent.user.firstName} ${editingStudent.user.lastName}`}
          description={`Update cohort assignment, enrollment status, or access window for ${editingStudent.course.title}.`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            {/* Student & Course Summary */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50 space-y-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {editingStudent.user.firstName} {editingStudent.user.lastName}
              </p>
              <p className="text-[11px] text-slate-500">{editingStudent.user.email}</p>
              <div className="pt-1 flex items-center gap-2">
                <Badge variant="indigo">{editingStudent.course.level}</Badge>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {editingStudent.course.title}
                </span>
              </div>
            </div>

            {/* Status Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Enrollment Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="EXPIRED">Expired</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Assigned Cohort / Class */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned Cohort / Class
              </label>
              <select
                value={editClassId}
                onChange={(e) => setEditClassId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="">None (Self-paced)</option>
                {teacherClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Expiration Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Access Expiration Date
              </label>
              <Input
                type="date"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-slate-400">Leave empty for unlimited access.</p>
            </div>

            {/* CEFR Current & Target Level */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Current CEFR Level
                </label>
                <select
                  value={editCurrentLevel}
                  onChange={(e) => setEditCurrentLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="PRE_A1">Pre-A1</option>
                  <option value="A1">A1 Beginner</option>
                  <option value="A2">A2 Elementary</option>
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper Int</option>
                  <option value="C1">C1 Advanced</option>
                  <option value="C2">C2 Mastery</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target CEFR Level
                </label>
                <select
                  value={editTargetLevel}
                  onChange={(e) => setEditTargetLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="A1">A1 Beginner</option>
                  <option value="A2">A2 Elementary</option>
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper Int</option>
                  <option value="C1">C1 Advanced</option>
                  <option value="C2">C2 Mastery</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingStudent(null)}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingEdit}>
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

      {/* Delete / Unenroll Confirmation Modal */}
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
              <strong className="text-slate-900 dark:text-white">
                {deletingStudent.course.title}
              </strong>
              ?
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
              This action will revoke the student&apos;s access to lessons, quizzes, and class sessions in this course.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingStudent(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteEnrollment}
                disabled={deleting}
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
    </div>
  );
}
