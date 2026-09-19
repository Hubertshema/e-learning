'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Plus,
  BookOpen,
  ArrowLeft,
  Trash2,
  Edit2,
  CheckCircle2,
  Video,
  FileText,
  Clock,
  Sparkles,
  Eye,
  AlertCircle,
  MoreVertical,
  X,
  RefreshCw
} from 'lucide-react';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

interface Lesson {
  id: string;
  title: string;
  skill: string;
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
  price?: number;
  durationDays?: number;
  units: Unit[];
}

export default function TeacherCourseUnitsBuilderPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<{ id: string; title: string } | null>(null);

  const [unitTitle, setUnitTitle] = useState('');
  const [unitDesc, setUnitDesc] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    data: course,
    loading,
    refresh: fetchCourseUnits
  } = useCachedData<CourseData | null>(
    courseId ? `teacher_course_units_${courseId}` : null,
    async () => {
      const res = await apiClient.get<CourseData>(`/teacher/courses/${courseId}`);
      return (res as any)?.data || res || null;
    },
    { ttl: 120_000 }
  );

  const handleOpenAddUnit = () => {
    setEditingUnit(null);
    setUnitTitle('');
    setUnitDesc('');
    setShowAddUnitModal(true);
  };

  const handleOpenEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitTitle(unit.title);
    setUnitDesc(unit.description || '');
    setShowAddUnitModal(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitTitle.trim()) return;

    try {
      setSavingUnit(true);
      if (editingUnit) {
        await apiClient.patch(`/teacher/units/${editingUnit.id}`, {
          title: unitTitle,
          description: unitDesc,
        });
        setFeedback({ type: 'success', message: `Unit "${unitTitle}" updated.` });
      } else {
        await apiClient.post(`/teacher/courses/${courseId}/units`, {
          title: unitTitle,
          description: unitDesc,
          orderIndex: (course?.units.length || 0) + 1,
        });
        setFeedback({ type: 'success', message: `Unit "${unitTitle}" created successfully.` });
      }

      setShowAddUnitModal(false);
      clientCache.invalidate('teacher_');
      fetchCourseUnits();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save unit.' });
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;
    try {
      setSavingUnit(true);
      await apiClient.delete(`/teacher/units/${deletingUnit.id}`);
      setFeedback({ type: 'success', message: `Unit "${deletingUnit.title}" deleted.` });
      setDeletingUnit(null);
      clientCache.invalidate('teacher_');
      fetchCourseUnits();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete unit.' });
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deletingLesson) return;
    try {
      await apiClient.delete(`/teacher/lessons/${deletingLesson.id}`);
      setFeedback({ type: 'success', message: `Lesson "${deletingLesson.title}" deleted.` });
      setDeletingLesson(null);
      clientCache.invalidate('teacher_');
      fetchCourseUnits();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete lesson.' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
        <Card className="h-96 bg-slate-100 dark:bg-slate-900" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card className="p-12 text-center max-w-md mx-auto my-12 space-y-3">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-1" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Course Not Found</h3>
        <p className="text-xs text-slate-500">The requested curriculum could not be retrieved.</p>
        <Link href="/teacher/courses">
          <Button variant="outline" size="sm">Back to Courses</Button>
        </Link>
      </Card>
    );
  }

  const totalLessons = course.units.reduce((acc, u) => acc + (u.lessons?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl pb-16 animate-fade-in">
      {/* 1. Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/teacher/courses">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="indigo">CEFR {course.level}</Badge>
              <span className="text-xs font-semibold text-slate-500">
                {course.units.length} Units • {totalLessons} Lessons
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/teacher/courses/${courseId}/preview`}>
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
          </Link>
          <Button variant="gradient" size="sm" onClick={handleOpenAddUnit} className="text-xs font-bold shadow-md">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Unit
          </Button>
        </div>
      </div>

      {/* 2. Feedback Notification */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px] hover:text-slate-900 dark:hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Units & Lessons Accordion List */}
      {course.units.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-slate-200 dark:border-slate-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950 mb-4">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Curriculum is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Organize this course into thematic units (e.g. Unit 1: Foundations & Introductions).
          </p>
          <Button variant="gradient" size="sm" onClick={handleOpenAddUnit}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Unit 1
          </Button>
        </Card>
      ) : (
        <div className="space-y-5">
          {course.units.map((unit, uIdx) => (
            <Card key={unit.id} className="overflow-hidden border-slate-200/80 dark:border-slate-800 shadow-xs">
              {/* Unit Header Bar */}
              <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" className="text-xs font-bold">
                      Unit {uIdx + 1}
                    </Badge>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{unit.title}</h2>
                  </div>
                  {unit.description && (
                    <p className="text-xs text-slate-500 mt-1">{unit.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Link href={`/teacher/courses/${courseId}/lessons/create?unitId=${unit.id}`}>
                    <Button variant="gradient" size="sm" className="text-xs h-7 font-bold shadow-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add Lesson
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 dark:hover:text-white"
                    onClick={() => handleOpenEditUnit(unit)}
                    title="Edit Unit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeletingUnit(unit)}
                    title="Delete Unit"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Lessons inside Unit */}
              <div className="p-4 space-y-2">
                {unit.lessons.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400">No lessons created in this unit yet.</p>
                    <Link href={`/teacher/courses/${courseId}/lessons/create?unitId=${unit.id}`}>
                      <Button variant="outline" size="sm" className="mt-2 text-xs">
                        <Sparkles className="h-3 w-3 mr-1 text-primary-600" /> Create Multi-Skill Lesson
                      </Button>
                    </Link>
                  </div>
                ) : (
                  unit.lessons.map((lesson, lIdx) => {
                    const skillIcons: Record<string, string> = {
                      GRAMMAR: '🔤',
                      VOCABULARY: '📚',
                      SPEAKING: '🗣️',
                      LISTENING: '🎧',
                      READING: '📖',
                      WRITING: '✍️',
                      PRONUNCIATION: '🔊',
                      COMMUNICATION: '🌐',
                    };
                    const skillIcon = skillIcons[lesson.skill] || '📝';

                    return (
                      <div
                        key={lesson.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 hover:shadow-xs transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold text-xs">
                            {lIdx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                              {lesson.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {((lesson as any).skills && (lesson as any).skills.length > 0
                                ? (lesson as any).skills
                                : [lesson.skill]
                              ).map((sk: string) => (
                                <Badge key={sk} variant="indigo" className="text-[10px] py-0 font-semibold">
                                  {skillIcons[sk] || '📝'} {sk}
                                </Badge>
                              ))}
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-1">
                                <Clock className="h-3 w-3" /> {lesson.estimatedMinutes || 30} mins
                              </span>
                              {lesson.sections && lesson.sections.length > 0 && (
                                <span className="text-[11px] text-slate-400">
                                  • {lesson.sections.length} sections
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <Link href={`/teacher/courses/${courseId}/lessons/${lesson.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs font-semibold hover:border-primary-500 hover:text-primary-600"
                            >
                              <Edit2 className="h-3 w-3 mr-1" /> Edit Lesson
                            </Button>
                          </Link>

                          <Link href={`/teacher/courses/${courseId}/preview`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              title="Preview Simulator"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingLesson({ id: lesson.id, title: lesson.title })}
                            title="Delete Lesson"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 4. ADD / EDIT UNIT MODAL */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUnit ? 'Edit Curriculum Unit' : 'Create New Curriculum Unit'}
              </h3>
              <button
                onClick={() => setShowAddUnitModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Unit Title
                </label>
                <Input
                  placeholder="e.g. Unit 3: Professional Business Inquiries & Meetings"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Unit Summary / Thematic Outcomes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Master workplace vocabulary, professional telephone calls, and email follow-ups..."
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddUnitModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={savingUnit} className="font-bold">
                  {savingUnit ? 'Saving...' : editingUnit ? 'Update Unit' : 'Create Unit'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 5. DELETE UNIT CONFIRMATION */}
      {deletingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full p-6 space-y-4 border-destructive/20 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Curriculum Unit</h3>
                <p className="text-xs text-slate-500">This action will delete all lessons inside this unit.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>&quot;{deletingUnit.title}&quot;</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeletingUnit(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" size="sm" disabled={savingUnit} onClick={handleDeleteUnit}>
                {savingUnit ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 6. DELETE LESSON CONFIRMATION */}
      {deletingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full p-6 space-y-4 border-destructive/20 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Lesson</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete lesson <strong>&quot;{deletingLesson.title}&quot;</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeletingLesson(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleDeleteLesson}>
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
