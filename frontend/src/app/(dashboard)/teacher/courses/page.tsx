'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  Globe,
  Eye,
  RefreshCw,
  LayoutGrid,
  List,
  Users,
  Clock,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
  Check,
  X,
  GraduationCap,
  SlidersHorizontal,
  ArrowUpRight
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { useCachedData, clientCache } from '@/lib/cache';

interface Lesson {
  id: string;
  title: string;
  orderIndex?: number;
  estimatedMinutes?: number;
  skill?: string;
}

interface Unit {
  id: string;
  title: string;
  description?: string;
  orderIndex?: number;
  lessons?: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug?: string;
  description: string;
  level: string;
  published: boolean;
  units?: Unit[];
  _count?: {
    enrollments?: number;
    units?: number;
  };
}

// Levels will be fetched from API instead of hardcoded
// const CEFR_LEVELS = [ ... ];

export default function TeacherCoursesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Modal States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    level: '', // Will be initialized when levels are loaded
    published: true,
  });

  const { data: rawLevels } = useCachedData<any[]>(
    'teacher_levels_list',
    async () => {
      const res = await apiClient.get<any>('/levels');
      return (res as any)?.data || res || [];
    },
    { ttl: 60_000 }
  );
  const levelsData = Array.isArray(rawLevels) ? rawLevels : [];
  const levelOptions = [
    { value: 'ALL', label: 'All Levels' },
    ...levelsData.map(l => ({ value: String(l.id), label: l.name }))
  ];

  const {
    data: rawCourses,
    loading,
    refresh: refreshCourses,
    mutate,
  } = useCachedData<Course[]>(
    'teacher_courses_list',
    async () => {
      const res = await apiClient.get<Course[]>('/teacher/courses');
      return Array.isArray(res) ? res : (res as any)?.data || (res as any)?.courses || [];
    },
    { ttl: 60_000 }
  );

  const courses = Array.isArray(rawCourses) ? rawCourses : [];

  // Filtered List
  const filteredCourses = courses.filter((c) => {
    const isPub = c.published ?? (c as any).isPublished ?? false;
    if (statusFilter === 'PUBLISHED' && !isPub) return false;
    if (statusFilter === 'DRAFT' && isPub) return false;
    if (selectedLevel !== 'ALL' && String(c.level) !== String(selectedLevel)) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchLvl = c.level?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLvl) return false;
    }
    return true;
  });

  // KPI Calculations
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.published ?? (c as any).isPublished).length;
  const totalUnits = courses.reduce((acc, c) => acc + (c.units?.length || c._count?.units || (c as any).unitCount || 0), 0);
  const totalEnrollments = courses.reduce((acc, c) => acc + (c._count?.enrollments || (c as any).enrollmentCount || 0), 0);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setCourseForm({
      title: '',
      description: '',
      level: levelsData.length > 0 ? String(levelsData[0].id) : '',
      published: true,
    });
    setShowCourseModal(true);
  };

  const handleOpenEditModal = (c: Course) => {
    setEditingCourse(c);
    setCourseForm({
      title: c.title,
      description: c.description || '',
      level: c.level ? String(c.level) : (levelsData.length > 0 ? String(levelsData[0].id) : ''),
      published: Boolean(c.published),
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim()) {
      setFeedback({ type: 'error', message: 'Course title is required.' });
      return;
    }

    try {
      setSaving(true);
      if (editingCourse) {
        await apiClient.put(`/teacher/courses/${editingCourse.id}`, courseForm);
        setFeedback({ type: 'success', message: `Course "${courseForm.title}" updated successfully!` });
      } else {
        await apiClient.post('/teacher/courses', courseForm);
        setFeedback({ type: 'success', message: `Course "${courseForm.title}" created successfully!` });
      }
      setShowCourseModal(false);
      clientCache.invalidate('teacher_');
      await refreshCourses();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save course.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      setActionLoadingId(course.id);
      const endpoint = course.published ? 'unpublish' : 'publish';
      await apiClient.post(`/teacher/courses/${course.id}/${endpoint}`);
      const newStatus = !course.published;
      mutate((prev) =>
        prev ? prev.map((item) => (item.id === course.id ? { ...item, published: newStatus } : item)) : []
      );
      setFeedback({
        type: 'success',
        message: newStatus
          ? `"${course.title}" is now published and open for student enrollments.`
          : `"${course.title}" is now draft/unpublished.`,
      });
      clientCache.invalidate('teacher_');
      await refreshCourses();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update course status' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    try {
      setSaving(true);
      await apiClient.delete(`/teacher/courses/${deletingCourse.id}`);
      setFeedback({ type: 'success', message: `Course "${deletingCourse.title}" deleted.` });
      setDeletingCourse(null);
      clientCache.invalidate('teacher_');
      await refreshCourses();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete course' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">Curriculum Studio</Badge>
            <span className="text-xs font-semibold text-slate-500">Learning Levels</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Courses & Multi-Skill Lessons
          </h1>
          <p className="text-xs text-slate-500">
            Design interactive courses, structured units, and skill-focused exercises tailored for each learning level.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshCourses()}
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={handleOpenCreateModal}
            className="h-9 px-4 font-bold text-xs shadow-md"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create New Course
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Courses</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{totalCourses}</p>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Published Tracks</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{publishedCourses}</p>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Curriculum Units</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{totalUnits}</p>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Active Students</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{totalEnrollments}</p>
          </div>
        </Card>
      </div>

      {/* 3. Feedback Notification Banner */}
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

      {/* 4. Controls Toolbar: Search, Level Filter, Status Filter & View Switcher */}
      <Card className="p-4 border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by title, level, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Status Tabs & View Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    statusFilter === st
                      ? 'bg-white text-primary-700 shadow-xs dark:bg-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st === 'PUBLISHED' ? 'Published' : 'Drafts'}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-white dark:bg-slate-900">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'GRID'
                    ? 'bg-slate-100 text-primary-600 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'LIST'
                    ? 'bg-slate-100 text-primary-600 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Level Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> Level:
          </span>
          {levelOptions.map((lvl) => (
            <button
              key={lvl.value}
              onClick={() => setSelectedLevel(lvl.value)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedLevel === lvl.value
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 5. Course List / Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4 border-slate-200/80 dark:border-slate-800 animate-pulse">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-slate-200 dark:border-slate-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 mb-4">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {search || selectedLevel !== 'ALL' || statusFilter !== 'ALL'
              ? 'No courses match the active filters'
              : 'No Courses Created Yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {search || selectedLevel !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting or clearing your search term and level filter.'
              : 'Start by building your first course with units and multi-skill lessons.'}
          </p>
          <Button variant="gradient" size="sm" onClick={handleOpenCreateModal}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create First Course
          </Button>
        </Card>
      ) : viewMode === 'GRID' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => {
            const unitCount = c.units?.length ?? c._count?.units ?? (c as any).unitCount ?? 0;
            const lessonCount = c.units?.reduce((acc, u) => acc + (u.lessons?.length || 0), 0) || (c as any).lessonCount || 0;
            const isPub = c.published ?? (c as any).isPublished ?? false;
            const isPublishLoading = actionLoadingId === c.id;

            return (
              <Card
                key={c.id}
                className="overflow-hidden border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between"
              >
                {/* Top Card Content */}
                <div className="p-6 space-y-4">
                  {/* Badge & Status Header */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="indigo" className="font-bold text-xs px-2.5 py-0.5">
                      {levelsData.find(l => String(l.id) === String(c.level))?.name || `Level ${c.level}`}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      <Badge variant={isPub ? 'success' : 'warning'} className="text-[11px] font-bold">
                        {isPub ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {c.description || 'No description provided for this course syllabus.'}
                    </p>
                  </div>

                  {/* Metric Chips */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-medium">Units</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{unitCount}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-medium">Lessons</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{lessonCount}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Curriculum Studio Link */}
                    <Link href={`/teacher/courses/${c.id}/units`}>
                      <Button size="sm" variant="gradient" className="text-xs h-8 font-bold px-3">
                        <Layers className="h-3.5 w-3.5 mr-1" />
                        Curriculum Studio
                      </Button>
                    </Link>

                    {/* Preview Simulator */}
                    <Link href={`/teacher/courses/${c.id}/preview`}>
                      <Button size="sm" variant="outline" className="text-xs h-8 px-2.5" title="Preview as Student">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  {/* Actions (Toggle Publish / Edit / Delete) */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePublish(c)}
                      disabled={isPublishLoading}
                      className="text-xs h-8 px-2"
                      title={c.published ? 'Unpublish Course' : 'Publish Course'}
                    >
                      <Globe className={`h-3.5 w-3.5 ${c.published ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditModal(c)}
                      className="text-xs h-8 px-2"
                      title="Edit Course Settings"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingCourse(c)}
                      className="text-xs h-8 px-2 text-destructive hover:bg-destructive/10"
                      title="Delete Course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* LIST / TABLE VIEW */
        <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Course Program</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Curriculum Units</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 font-bold">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold">{c.title}</p>
                          <p className="text-[11px] text-slate-400 font-normal line-clamp-1">{c.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="indigo" className="text-[11px]">{levelsData.find(l => String(l.id) === String(c.level))?.name || `Level ${c.level}`}</Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <strong>{c.units?.length || c._count?.units || (c as any).unitCount || 0}</strong> Units
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={(c.published ?? (c as any).isPublished) ? 'success' : 'warning'}>
                        {(c.published ?? (c as any).isPublished) ? 'Published' : 'Draft'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/teacher/courses/${c.id}/units`}>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 font-bold">
                            <Layers className="h-3 w-3 mr-1" />
                            Curriculum
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditModal(c)}
                          className="h-7 w-7 p-0"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingCourse(c)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 6. CREATE / EDIT COURSE MODAL */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-lg w-full p-6 space-y-5 border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingCourse ? 'Edit Course Program' : 'Create New Course Program'}
                </h3>
              </div>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Course Title
                </label>
                <Input
                  placeholder="e.g. B1 Intermediate English — Workplace & Social Fluency"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Learning Level
                </label>
                <select
                  value={courseForm.level}
                  onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  {levelsData.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="publishedCheck"
                    checked={courseForm.published}
                    onChange={(e) => setCourseForm({ ...courseForm, published: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="publishedCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Publish immediately
                  </label>
                </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Course Description & Learning Objectives
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the topics covered, target skill areas, and real-world outcomes..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCourseModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={saving} className="font-bold">
                  {saving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full p-6 space-y-4 border-destructive/20 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Course Program
                </h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>&quot;{deletingCourse.title}&quot;</strong> and all associated units, lessons, and activities?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeletingCourse(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" size="sm" disabled={saving} onClick={handleDeleteCourse}>
                {saving ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
