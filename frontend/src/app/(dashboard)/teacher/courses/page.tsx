'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Layers,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
  Headphones,
  Mic,
  PenTool
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Lesson {
  id: string;
  title: string;
  order: number;
  durationMinutes: number;
  skillType?: string;
  hasAudio?: boolean;
}

interface Unit {
  id: string;
  title: string;
  order: number;
  description?: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  price: number;
  durationDays: number;
  published: boolean;
  units: Unit[];
  _count?: {
    enrollments: number;
  };
}

const ENGLISH_LEVELS = [
  { value: 'A1', label: 'A1 - Absolute Beginner (Foundations)' },
  { value: 'A2', label: 'A2 - Elementary English (Everyday conversations)' },
  { value: 'B1', label: 'B1 - Intermediate English (Work & Social fluency)' },
  { value: 'B2', label: 'B2 - Upper Intermediate (Professional discourse)' },
  { value: 'C1', label: 'C1 - Advanced (Academic & Business Mastery)' },
  { value: 'C2', label: 'C2 - Mastery / Native-level Fluency' },
];

const SKILL_TYPES = [
  'READING',
  'LISTENING',
  'SPEAKING',
  'WRITING',
  'GRAMMAR',
  'VOCABULARY',
  'PRONUNCIATION'
];

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Modal / Form States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Course Form
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    level: 'A1',
    price: 49.99,
    durationDays: 90,
    published: true,
  });

  // Unit Form
  const [unitForm, setUnitForm] = useState({
    title: '',
    description: '',
    order: 1,
  });

  // Lesson Form
  const [lessonForm, setLessonForm] = useState({
    title: '',
    order: 1,
    durationMinutes: 45,
    content: '',
    videoUrl: '',
    audioUrl: '',
    skillType: 'GRAMMAR',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Course[]>('/teacher/courses');
      const coursesList: Course[] = Array.isArray(res) ? res : (res as any)?.data || (res as any)?.courses || [];
      setCourses(coursesList);
      if (coursesList.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesList[0]);
      } else if (selectedCourse) {
        const updated = coursesList.find((c) => c.id === selectedCourse.id);
        if (updated) setSelectedCourse(updated);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.post('/teacher/courses', courseForm);
      setFeedback({ type: 'success', message: 'Course created successfully!' });
      setShowCourseModal(false);
      setCourseForm({ title: '', description: '', level: 'A1', price: 49.99, durationDays: 90, published: true });
      await fetchCourses();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create course' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      setSaving(true);
      await apiClient.post(`/teacher/courses/${selectedCourse.id}/units`, unitForm);
      setFeedback({ type: 'success', message: 'Curriculum Unit created!' });
      setShowUnitModal(false);
      setUnitForm({ title: '', description: '', order: (selectedCourse.units?.length || 0) + 1 });
      await fetchCourses();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create unit' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedUnitId) return;
    try {
      setSaving(true);
      await apiClient.post(`/teacher/courses/${selectedCourse.id}/units/${selectedUnitId}/lessons`, lessonForm);
      setFeedback({ type: 'success', message: 'Lesson added with 7-skill module support!' });
      setShowLessonModal(false);
      setLessonForm({
        title: '',
        order: 1,
        durationMinutes: 45,
        content: '',
        videoUrl: '',
        audioUrl: '',
        skillType: 'GRAMMAR',
      });
      await fetchCourses();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create lesson' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Curriculum & Course Studio</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Courses & Multi-Skill Lessons
          </h1>
          <p className="text-xs text-slate-500">
            Design interactive CEFR-aligned English courses, structured units, and skill-focused exercises.
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setShowCourseModal(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create New Course
        </Button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Main Studio View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Course Selector List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Your Courses ({courses.length})</span>
          </h2>
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading courses...</div>
          ) : courses.length > 0 ? (
            <div className="space-y-3">
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                return (
                  <Card
                    key={c.id}
                    onClick={() => setSelectedCourse(c)}
                    className={`cursor-pointer transition-all p-4 ${
                      isSelected
                        ? 'border-primary-500 ring-2 ring-primary-500/20 dark:border-primary-400 shadow-md'
                        : 'hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="indigo">{c.level}</Badge>
                          {c.published ? (
                            <Badge variant="success">Published</Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.description}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 mt-1 transition-transform ${isSelected ? 'text-primary-600 translate-x-1' : 'text-slate-400'}`} />
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{c.units?.length || 0} Units</span>
                      <span className="font-bold text-slate-900 dark:text-white">${c.price}</span>
                      <span>{c._count?.enrollments || 0} Enrolled</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No courses yet</p>
              <p className="text-[11px] text-slate-500 mb-3">Create your first English curriculum.</p>
              <Button size="sm" variant="gradient" onClick={() => setShowCourseModal(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                New Course
              </Button>
            </Card>
          )}
        </div>

        {/* Right Column (2 cols): Selected Course Curriculum Detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCourse ? (
            <>
              {/* Course Detail Banner */}
              <Card className="p-5 border-l-4 border-l-primary-600">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                        Active Curriculum
                      </span>
                      <Badge variant="indigo">{selectedCourse.level}</Badge>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {selectedCourse.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      {selectedCourse.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUnitForm({ title: '', description: '', order: (selectedCourse.units?.length || 0) + 1 });
                        setShowUnitModal(true);
                      }}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Unit
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Units & Lessons List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary-600" />
                  Curriculum Units ({selectedCourse.units?.length || 0})
                </h3>

                {selectedCourse.units && selectedCourse.units.length > 0 ? (
                  selectedCourse.units.map((unit, index) => (
                    <Card key={unit.id} className="overflow-hidden border border-slate-200 dark:border-slate-800">
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between dark:bg-slate-900/80 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                            {index + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{unit.title}</span>
                            {unit.description && (
                              <p className="text-[11px] text-slate-500">{unit.description}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-primary-600 hover:text-primary-700"
                          onClick={() => {
                            setSelectedUnitId(unit.id);
                            setLessonForm({
                              title: '',
                              order: (unit.lessons?.length || 0) + 1,
                              durationMinutes: 45,
                              content: '',
                              videoUrl: '',
                              audioUrl: '',
                              skillType: 'GRAMMAR',
                            });
                            setShowLessonModal(true);
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Lesson
                        </Button>
                      </div>

                      <CardContent className="p-4 space-y-2">
                        {unit.lessons && unit.lessons.length > 0 ? (
                          unit.lessons.map((lesson, lIdx) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between rounded-lg border border-slate-100 p-3 bg-white hover:border-slate-200 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-mono text-slate-400">
                                  {index + 1}.{lIdx + 1}
                                </span>
                                <FileText className="h-4 w-4 text-slate-400" />
                                <div>
                                  <span className="text-xs font-medium text-slate-900 dark:text-white">
                                    {lesson.title}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[9px] py-0">
                                      {lesson.durationMinutes} mins
                                    </Badge>
                                    {lesson.skillType && (
                                      <Badge variant="indigo" className="text-[9px] py-0">
                                        {lesson.skillType}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center text-xs text-slate-400">
                            No lessons in this unit yet. Click "Add Lesson" to build exercises.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Curriculum is empty</p>
                    <p className="text-[11px] text-slate-500 mb-3">Add structured units (e.g. "Unit 1: Introductions & Pronunciation") to get started.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUnitForm({ title: '', description: '', order: 1 });
                        setShowUnitModal(true);
                      }}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add First Unit
                    </Button>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center text-slate-400">
              Select or create a course on the left to edit its syllabus.
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Create Course */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base">Create New English Course</CardTitle>
              <CardDescription className="text-xs">
                Set course level, pricing, and duration for prospective students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Spoken English: B1 Workplace Communication"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CEFR English Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  >
                    {ENGLISH_LEVELS.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tuition Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={courseForm.price}
                      onChange={(e) => setCourseForm({ ...courseForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Access Duration (Days)</label>
                    <input
                      type="number"
                      required
                      value={courseForm.durationDays}
                      onChange={(e) => setCourseForm({ ...courseForm, durationDays: parseInt(e.target.value) || 90 })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Overview / Objectives</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Comprehensive description of what the student will learn..."
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCourseModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" disabled={saving}>
                    {saving ? 'Creating...' : 'Save & Publish Course'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Create Unit */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base">Add Curriculum Unit</CardTitle>
              <CardDescription className="text-xs">
                Group lessons into thematic chapters or weekly modules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUnit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 1: Workplace Email Writing & Etiquette"
                    value={unitForm.title}
                    onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Focus / Summary</label>
                  <input
                    type="text"
                    placeholder="Brief description of this unit's outcomes"
                    value={unitForm.description}
                    onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowUnitModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" disabled={saving}>
                    {saving ? 'Saving...' : 'Add Unit'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Create Lesson */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-600" />
                Add Multi-Skill English Lesson
              </CardTitle>
              <CardDescription className="text-xs">
                Incorporate 7-skill sections, media resources, and interactive content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mastering Modal Verbs in Negotiation"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Primary 7-Skill Focus</label>
                    <select
                      value={lessonForm.skillType}
                      onChange={(e) => setLessonForm({ ...lessonForm, skillType: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    >
                      {SKILL_TYPES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Duration (Mins)</label>
                    <input
                      type="number"
                      required
                      value={lessonForm.durationMinutes}
                      onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: parseInt(e.target.value) || 30 })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Video className="h-3 w-3 text-blue-500" />
                      Video Stream URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://vimeo.com/... or youtube.com/..."
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Headphones className="h-3 w-3 text-emerald-500" />
                      Audio Track URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://cdn.example.com/audio.mp3"
                      value={lessonForm.audioUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, audioUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lesson Content, Grammar Rules & Examples (Markdown supported)
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="### Grammar Focus: Must vs Should&#10;&#10;1. Use **must** for strong obligations.&#10;2. Use **should** for advice."
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowLessonModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Lesson to Unit'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
