'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  AlertCircle,
  X,
} from 'lucide-react';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';

interface Lesson {
  id: string;
  title: string;
  skill: string;
  skills?: string[] | string;
  estimatedMinutes: number;
  orderIndex: number;
  isPublished: boolean;
  sections?: any[];
}

interface Unit {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  level: string;
  units: Unit[];
}

const SKILL_ICONS: Record<string, string> = {
  GRAMMAR: '🔤',
  VOCABULARY: '📚',
  SPEAKING: '🗣️',
  LISTENING: '🎧',
  READING: '📖',
  WRITING: '✍️',
  PRONUNCIATION: '🔊',
  COMMUNICATION: '🌐',
};

export default function StudioCurriculumPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<{ id: string; title: string } | null>(null);
  const [unitTitle, setUnitTitle] = useState('');
  const [unitDesc, setUnitDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const {
    data: course,
    loading,
    refresh: reload,
  } = useCachedData<CourseData | null>(
    courseId ? `studio_course_${courseId}` : null,
    async () => {
      const res = await apiClient.get<CourseData>(`/teacher/courses/${courseId}`);
      return (res as any)?.data || res || null;
    },
    { ttl: 60_000 }
  );

  const openAddUnit = () => { setEditingUnit(null); setUnitTitle(''); setUnitDesc(''); setShowUnitModal(true); };
  const openEditUnit = (u: Unit) => { setEditingUnit(u); setUnitTitle(u.title); setUnitDesc(u.description || ''); setShowUnitModal(true); };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitTitle.trim()) return;
    try {
      setSaving(true);
      if (editingUnit) {
        await apiClient.patch(`/teacher/units/${editingUnit.id}`, { title: unitTitle, description: unitDesc });
        showToast('success', `Unit "${unitTitle}" updated.`);
      } else {
        await apiClient.post(`/teacher/courses/${courseId}/units`, {
          title: unitTitle,
          description: unitDesc,
          orderIndex: (course?.units.length || 0) + 1,
        });
        showToast('success', `Unit "${unitTitle}" created.`);
      }
      setShowUnitModal(false);
      clientCache.invalidate('studio_course_');
      reload();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save unit.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;
    try {
      setSaving(true);
      await apiClient.delete(`/teacher/units/${deletingUnit.id}`);
      showToast('success', `Unit "${deletingUnit.title}" deleted.`);
      setDeletingUnit(null);
      clientCache.invalidate('studio_course_');
      reload();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete unit.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deletingLesson) return;
    try {
      await apiClient.delete(`/teacher/lessons/${deletingLesson.id}`);
      showToast('success', `Lesson "${deletingLesson.title}" deleted.`);
      setDeletingLesson(null);
      clientCache.invalidate('studio_course_');
      reload();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete lesson.');
    }
  };

  const lessonSkills = (lesson: Lesson): string[] => {
    if (Array.isArray(lesson.skills) && lesson.skills.length > 0) return lesson.skills;
    if (typeof lesson.skills === 'string' && lesson.skills.startsWith('{')) {
      return lesson.skills.slice(1, -1).split(',').filter(Boolean);
    }
    return lesson.skill ? [lesson.skill] : ['GRAMMAR'];
  };

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="h-7 w-56 rounded-xl bg-slate-200" />
          <div className="h-8 w-28 rounded-lg bg-slate-200" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="h-16 bg-slate-100" />
            <div className="p-4 space-y-2">
              {[1, 2].map((j) => <div key={j} className="h-12 rounded-xl bg-slate-100" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-rose-400" />
        <p className="text-sm font-semibold text-slate-700">Course not found</p>
        <Link href="/teacher/courses">
          <Button variant="outline" size="sm">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const totalLessons = course.units.reduce((a, u) => a + (u.lessons?.length || 0), 0);

  return (
    <div className="max-w-4xl pb-20 space-y-6">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-800'
              : 'bg-white border-rose-200 text-rose-700'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            : <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="indigo" className="text-xs">{course.level}</Badge>
            <span className="text-xs text-slate-400 font-medium">
              {course.units.length} units · {totalLessons} lessons
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Curriculum Builder</h1>
          <p className="text-xs text-slate-500 mt-0.5">Organize your course into units and lessons</p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={openAddUnit}
          className="text-xs font-bold shadow-md shrink-0"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Unit
        </Button>
      </div>

      {/* Empty State */}
      {course.units.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-slate-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f2e8] text-[#315b36]">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No units yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-5">
            Start organizing your course by creating the first unit (e.g. "Unit 1: Getting Started")
          </p>
          <Button variant="gradient" size="sm" onClick={openAddUnit}>
            <Plus className="h-4 w-4 mr-1.5" /> Create First Unit
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {course.units.map((unit, uIdx) => (
            <Card key={unit.id} className="overflow-hidden border-[#e2ebe2] shadow-sm">

              {/* Unit Header */}
              <div className="flex items-center justify-between gap-4 bg-[#f8fbf8] border-b border-[#e2ebe2] px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#315b36] text-white text-[10px] font-black">
                      {uIdx + 1}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 truncate">{unit.title}</h2>
                  </div>
                  {unit.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 ml-8 leading-snug">{unit.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/studio/${courseId}/lessons/create?unitId=${unit.id}`}>
                    <Button variant="gradient" size="sm" className="text-[11px] h-7 px-2.5 font-bold">
                      <Plus className="h-3 w-3 mr-1" /> Add Lesson
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-[#315b36]"
                    onClick={() => openEditUnit(unit)}
                    title="Edit unit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => setDeletingUnit(unit)}
                    title="Delete unit"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Lessons */}
              <div className="p-4 space-y-2">
                {unit.lessons.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 border border-dashed border-[#ddeedd] rounded-xl">
                    <p className="text-[11px] text-slate-400">No lessons in this unit yet</p>
                    <Link href={`/studio/${courseId}/lessons/create?unitId=${unit.id}`}>
                      <Button variant="outline" size="sm" className="text-xs border-[#c8dfc8] text-[#315b36] hover:bg-[#f0f8f0]">
                        <Sparkles className="h-3 w-3 mr-1 text-[#315b36]" /> Create First Lesson
                      </Button>
                    </Link>
                  </div>
                ) : (
                  unit.lessons.map((lesson, lIdx) => (
                    <div
                      key={lesson.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-[#c8dfc8] hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0f8f0] text-[#315b36] text-[11px] font-black">
                          {lIdx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{lesson.title}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {lessonSkills(lesson).map((sk) => (
                              <span
                                key={sk}
                                className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"
                              >
                                {SKILL_ICONS[sk] || '📝'} {sk}
                              </span>
                            ))}
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock className="h-2.5 w-2.5" />
                              {lesson.estimatedMinutes || 30} min
                            </span>
                            {lesson.sections && lesson.sections.length > 0 && (
                              <span className="text-[10px] text-slate-400">
                                · {lesson.sections.length} sections
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <Link href={`/studio/${courseId}/lessons/${lesson.id}/edit`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-[11px] font-semibold border-[#c8dfc8] text-[#315b36] hover:bg-[#f0f8f0]"
                          >
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </Link>
                        <Link href={`/teacher/courses/${courseId}/preview?lessonId=${lesson.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-[#315b36]"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDeletingLesson({ id: lesson.id, title: lesson.title })}
                          title="Delete lesson"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── ADD / EDIT UNIT MODAL ───────────────────────────────────── */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-2xl border-[#e2ebe2]">
            <div className="flex items-center justify-between border-b border-[#e2ebe2] pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingUnit ? 'Edit Unit' : 'Create New Unit'}
              </h3>
              <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveUnit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Title</label>
                <Input
                  placeholder="e.g. Unit 1: Foundations & Greetings"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="What students will learn in this unit…"
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-[#315b36] resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t border-[#e2ebe2]">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowUnitModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={saving} className="font-bold">
                  {saving ? 'Saving…' : editingUnit ? 'Update Unit' : 'Create Unit'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── DELETE UNIT CONFIRM ────────────────────────────────────── */}
      {deletingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-sm w-full p-6 space-y-4 shadow-2xl border-rose-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Unit</h3>
                <p className="text-[11px] text-slate-400">All lessons inside will also be deleted.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Delete <strong>"{deletingUnit.title}"</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setDeletingUnit(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" disabled={saving} onClick={handleDeleteUnit}>
                {saving ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── DELETE LESSON CONFIRM ──────────────────────────────────── */}
      {deletingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-sm w-full p-6 space-y-4 shadow-2xl border-rose-200">
            <h3 className="text-sm font-bold text-slate-900">Delete Lesson</h3>
            <p className="text-xs text-slate-600">
              Delete <strong>"{deletingLesson.title}"</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setDeletingLesson(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteLesson}>Confirm Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
