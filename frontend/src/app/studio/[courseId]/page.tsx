'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
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
  AlertCircle,
  X,
  Eye,
  Video,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  Sparkles,
  Play,
  Filter,
  GraduationCap,
  SlidersHorizontal,
  ExternalLink,
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
  isPublished?: boolean;
  units: Unit[];
}

const SKILL_THEMES: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  GRAMMAR: {
    label: 'Grammar',
    icon: '🔤',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200/80 dark:border-indigo-800/60',
  },
  VOCABULARY: {
    label: 'Vocabulary',
    icon: '📚',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/80 dark:border-emerald-800/60',
  },
  SPEAKING: {
    label: 'Speaking',
    icon: '🗣️',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200/80 dark:border-amber-800/60',
  },
  LISTENING: {
    label: 'Listening',
    icon: '🎧',
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200/80 dark:border-sky-800/60',
  },
  READING: {
    label: 'Reading',
    icon: '📖',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200/80 dark:border-blue-800/60',
  },
  WRITING: {
    label: 'Writing',
    icon: '✍️',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200/80 dark:border-rose-800/60',
  },
  PRONUNCIATION: {
    label: 'Pronunciation',
    icon: '🔊',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200/80 dark:border-purple-800/60',
  },
  COMMUNICATION: {
    label: 'Communication',
    icon: '🌐',
    bg: 'bg-teal-50 dark:bg-teal-950/50',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200/80 dark:border-teal-800/60',
  },
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

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('ALL');
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});

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

  const toggleUnitCollapse = (unitId: string) => {
    setCollapsedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const collapseAll = () => {
    if (!course) return;
    const all: Record<string, boolean> = {};
    course.units.forEach((u) => {
      all[u.id] = true;
    });
    setCollapsedUnits(all);
  };

  const expandAll = () => {
    setCollapsedUnits({});
  };

  const openAddUnit = () => {
    setEditingUnit(null);
    setUnitTitle('');
    setUnitDesc('');
    setShowUnitModal(true);
  };

  const openEditUnit = (u: Unit) => {
    setEditingUnit(u);
    setUnitTitle(u.title);
    setUnitDesc(u.description || '');
    setShowUnitModal(true);
  };

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

  const parseLessonSkills = (lesson: Lesson): string[] => {
    if (Array.isArray(lesson.skills) && lesson.skills.length > 0) return lesson.skills;
    if (typeof lesson.skills === 'string' && lesson.skills.startsWith('{')) {
      return lesson.skills.slice(1, -1).split(',').filter(Boolean);
    }
    return lesson.skill ? [lesson.skill] : ['GRAMMAR'];
  };

  // Metrics Calculations
  const stats = useMemo(() => {
    if (!course) return { totalUnits: 0, totalLessons: 0, totalMinutes: 0 };
    let lessonsCount = 0;
    let minutesCount = 0;
    course.units.forEach((u) => {
      const uLessons = u.lessons || [];
      lessonsCount += uLessons.length;
      uLessons.forEach((l) => {
        minutesCount += l.estimatedMinutes || 30;
      });
    });
    return {
      totalUnits: course.units.length,
      totalLessons: lessonsCount,
      totalMinutes: minutesCount,
    };
  }, [course]);

  // Filtered Units and Lessons
  const filteredUnits = useMemo(() => {
    if (!course) return [];
    if (!searchQuery.trim() && selectedSkill === 'ALL') {
      return course.units;
    }

    const q = searchQuery.toLowerCase().trim();

    return course.units
      .map((unit) => {
        const matchesUnitTitle = unit.title.toLowerCase().includes(q);
        const matchingLessons = (unit.lessons || []).filter((lesson) => {
          const skills = parseLessonSkills(lesson);
          const skillMatch =
            selectedSkill === 'ALL' ||
            skills.some((s) => s.toUpperCase() === selectedSkill.toUpperCase());
          const textMatch = !q || lesson.title.toLowerCase().includes(q) || matchesUnitTitle;
          return skillMatch && textMatch;
        });

        return {
          ...unit,
          lessons: matchingLessons,
        };
      })
      .filter((unit) => unit.lessons.length > 0 || !searchQuery);
  }, [course, searchQuery, selectedSkill]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-44 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/50">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Course Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            We couldn't retrieve the curriculum for this course. Please verify the link or return to courses.
          </p>
        </div>
        <Link href="/teacher/courses">
          <Button variant="outline" size="sm">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 space-y-6">

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-xl animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-[#F3F7FC] border-blue-200 text-[#012970] dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200'
              : 'bg-white border-rose-200 text-rose-700 dark:bg-slate-900 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#006EF3] shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          )}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── HERO STATS BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#012970] via-[#0b388b] to-[#012970] text-white p-6 md:p-8 shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-[#006EF3]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 h-48 w-48 rounded-full bg-[#F5B400]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-bold text-white">
                <Sparkles className="h-3.5 w-3.5 text-[#F5B400]" />
                {course.level || 'Standard Level'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B400] animate-pulse" />
                Curriculum Studio
              </span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                {course.title}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
                Design and organize dynamic units, interactive video lessons, quizzes, and vocabulary practices.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <Layers className="h-4 w-4 text-[#F5B400]" />
                <span>
                  <strong className="text-white font-bold">{stats.totalUnits}</strong> Units
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <Video className="h-4 w-4 text-[#F5B400]" />
                <span>
                  <strong className="text-white font-bold">{stats.totalLessons}</strong> Lessons
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-[#F5B400]" />
                <span>
                  <strong className="text-white font-bold">
                    {Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
                  </strong>{' '}
                  Total Content
                </span>
              </div>
            </div>
          </div>

          {/* Action Hub in Hero */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 self-start md:self-center w-full sm:w-auto">
            <Button
              onClick={openAddUnit}
              className="bg-[#006EF3] hover:bg-[#005ac6] text-white font-bold shadow-lg shadow-blue-950/40 text-xs px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Unit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH & FILTERS ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-2xl shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search lessons by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 outline-none focus:border-[#006EF3] text-slate-800 dark:text-white placeholder:text-slate-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Skill Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedSkill('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedSkill === 'ALL'
                ? 'bg-[#012970] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            All Skills
          </button>
          {['GRAMMAR', 'VOCABULARY', 'SPEAKING', 'LISTENING', 'PRONUNCIATION'].map((sk) => {
            const isSelected = selectedSkill === sk;
            const theme = SKILL_THEMES[sk];
            return (
              <button
                key={sk}
                onClick={() => setSelectedSkill(isSelected ? 'ALL' : sk)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#006EF3] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span>{theme?.icon || '📝'}</span>
                <span>{theme?.label || sk}</span>
              </button>
            );
          })}
        </div>

        {/* Expand / Collapse All Toggles */}
        <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            className="h-8 px-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400"
          >
            Expand All
          </Button>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            className="h-8 px-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400"
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* ── UNITS LIST ────────────────────────────────────────────────── */}
      {filteredUnits.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 rounded-3xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F7FC] text-[#006EF3] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {searchQuery || selectedSkill !== 'ALL'
              ? 'No matching lessons found'
              : 'No units in this course yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            {searchQuery || selectedSkill !== 'ALL'
              ? 'Try adjusting your search keywords or resetting skill filters.'
              : 'Start your course journey by creating your first unit (e.g. "Unit 1: Essentials & Greetings").'}
          </p>
          {searchQuery || selectedSkill !== 'ALL' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedSkill('ALL');
              }}
              className="rounded-xl text-xs"
            >
              Reset Filters
            </Button>
          ) : (
            <Button
              onClick={openAddUnit}
              className="bg-[#006EF3] hover:bg-[#005ac6] text-white font-bold rounded-xl text-xs px-5 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create First Unit
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredUnits.map((unit, uIdx) => {
            const isCollapsed = !!collapsedUnits[unit.id];
            const unitLessons = unit.lessons || [];
            const unitMinutes = unitLessons.reduce((acc, l) => acc + (l.estimatedMinutes || 30), 0);

            return (
              <div
                key={unit.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-blue-200 dark:hover:border-blue-800"
              >
                {/* Unit Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-slate-200/70 dark:border-slate-800 px-5 py-4">
                  <div
                    className="flex items-start sm:items-center gap-3 min-w-0 cursor-pointer flex-1"
                    onClick={() => toggleUnitCollapse(unit.id)}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#012970] text-white text-xs font-black shadow-xs">
                      {uIdx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {unit.title}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {unitLessons.length} {unitLessons.length === 1 ? 'lesson' : 'lessons'} · {unitMinutes} min
                        </span>
                      </div>
                      {unit.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {unit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Unit Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <Link href={`/studio/${courseId}/lessons/video/create?unitId=${unit.id}`}>
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs font-bold bg-[#F3F7FC] text-[#006EF3] border border-blue-200 hover:bg-[#006EF3] hover:text-white dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-[#006EF3] dark:hover:text-white rounded-xl transition-all"
                        title="Add Video Lesson into this unit"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1 text-[#006EF3] group-hover:text-white" />
                        <span>Add Lesson</span>
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      onClick={() => openEditUnit(unit)}
                      title="Edit unit details"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                      onClick={() => setDeletingUnit(unit)}
                      title="Delete unit"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    <button
                      onClick={() => toggleUnitCollapse(unit.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                      title={isCollapsed ? 'Expand Unit' : 'Collapse Unit'}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Lessons inside Unit */}
                {!isCollapsed && (
                  <div className="p-4 space-y-2.5 bg-slate-50/40 dark:bg-slate-950/30">
                    {unitLessons.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/60 dark:bg-slate-900/60">
                        <Video className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                        <p className="text-xs text-slate-400 font-medium">No lessons added to this unit yet</p>
                        <Link href={`/studio/${courseId}/lessons/video/create?unitId=${unit.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg mt-1">
                            <Plus className="h-3 w-3 mr-1" /> Create Lesson
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      unitLessons.map((lesson, lIdx) => {
                        const skills = parseLessonSkills(lesson);

                        return (
                          <div
                            key={lesson.id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-3.5 hover:border-blue-300 dark:hover:border-blue-700/60 hover:shadow-md transition-all duration-200"
                          >
                            {/* Left: Icon & Meta */}
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#012970] dark:from-slate-800 dark:to-slate-800/60 dark:text-blue-300 font-black text-xs border border-blue-200 dark:border-slate-700">
                                <span>{lIdx + 1}</span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {lesson.title}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {/* Skill Badges */}
                                  {skills.map((sk) => {
                                    const theme = SKILL_THEMES[sk.toUpperCase()];
                                    return (
                                      <span
                                        key={sk}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                                          theme
                                            ? `${theme.bg} ${theme.text} ${theme.border}`
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}
                                      >
                                        <span>{theme?.icon || '📝'}</span>
                                        <span>{theme?.label || sk}</span>
                                      </span>
                                    );
                                  })}

                                  {/* Estimated Duration */}
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    {lesson.estimatedMinutes || 30} mins
                                  </span>

                                  {/* Sections / Interactive points */}
                                  {lesson.sections && lesson.sections.length > 0 && (
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      · {lesson.sections.length} activities
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {/* Preview as Student */}
                              <Link href={`/student/interactive-video/${lesson.id}`} target="_blank">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2.5 text-xs font-semibold text-slate-500 hover:text-[#006EF3] hover:bg-[#F3F7FC] dark:hover:bg-slate-800 dark:hover:text-blue-400 rounded-xl"
                                  title="Preview as enrolled student"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1 text-[#006EF3]" />
                                  <span>Preview</span>
                                </Button>
                              </Link>

                              {/* Edit Interactive Lesson in Video Studio */}
                              <Link href={`/studio/${courseId}/lessons/video/${lesson.id}/editor`}>
                                <Button
                                  size="sm"
                                  className="h-8 px-3 text-xs font-bold bg-[#012970] hover:bg-[#006EF3] text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                                  title="Open Interactive Video Editor"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  <span>Edit Video</span>
                                </Button>
                              </Link>

                              {/* Delete Lesson */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 rounded-xl"
                                onClick={() => setDeletingLesson({ id: lesson.id, title: lesson.title })}
                                title="Delete lesson"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD / EDIT UNIT MODAL ───────────────────────────────────── */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full p-6 space-y-5 shadow-2xl border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingUnit ? 'Edit Unit Information' : 'Create Curriculum Unit'}
                </h3>
              </div>
              <button
                onClick={() => setShowUnitModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Unit Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Unit 1: Foundations & Introductions"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Unit Learning Goals <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize the core topics or competencies students will acquire in this unit…"
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-[#006EF3] resize-none transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnitModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-[#006EF3] hover:bg-[#005ac6] text-white font-bold rounded-xl text-xs px-4"
                >
                  {saving ? 'Saving…' : editingUnit ? 'Update Unit' : 'Create Unit'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── DELETE UNIT CONFIRM ────────────────────────────────────── */}
      {deletingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-sm w-full p-6 space-y-4 shadow-2xl border-rose-200 dark:border-rose-900/60 rounded-3xl bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/60 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Unit</h3>
                <p className="text-[11px] text-slate-400">All enclosed lessons will be permanently deleted.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong>"{deletingUnit.title}"</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingUnit(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={saving}
                onClick={handleDeleteUnit}
                className="rounded-xl text-xs font-bold"
              >
                {saving ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── DELETE LESSON CONFIRM ──────────────────────────────────── */}
      {deletingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-sm w-full p-6 space-y-4 shadow-2xl border-rose-200 dark:border-rose-900/60 rounded-3xl bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/60 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Lesson</h3>
                <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong>"{deletingLesson.title}"</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingLesson(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteLesson}
                className="rounded-xl text-xs font-bold"
              >
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

