'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';
import { Editor } from '@tinymce/tinymce-react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Award,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  GraduationCap,
  FileText,
  Mic,
  Upload,
  PenTool,
  Ear,
  Eye,
  BookMarked,
  Sparkles,
  Wand2,
  Loader2,
  StopCircle,
  RotateCcw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { clientCache } from '@/lib/cache';

interface LessonOption {
  id: string;
  title: string;
}

interface UnitOption {
  id: string;
  title: string;
  lessons: LessonOption[];
}

interface CourseOption {
  id: string;
  title: string;
  level: string;
  units: UnitOption[];
}

const SKILL_CATEGORIES = [
  { key: 'WRITING',       label: 'Writing',        icon: PenTool,    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' },
  { key: 'SPEAKING',      label: 'Speaking',        icon: Mic,        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
  { key: 'READING',       label: 'Reading',         icon: BookOpen,   color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
  { key: 'LISTENING',     label: 'Listening',       icon: Ear,        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
  { key: 'GRAMMAR',       label: 'Grammar',         icon: FileText,   color: 'text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700' },
  { key: 'VOCABULARY',    label: 'Vocabulary',      icon: BookMarked, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
  { key: 'PRONUNCIATION', label: 'Pronunciation',   icon: Eye,        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' },
];

const CEFR_LEVELS = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

function CreateAssignmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCourseId = searchParams.get('courseId') || '';
  const urlLessonId = searchParams.get('lessonId') || '';

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Linked course / lesson
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');

  // Assignment fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillType, setSkillType] = useState('WRITING');
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  // ── AI Assistant state ──
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiCefrLevel, setAiCefrLevel] = useState('B1');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const editorRef = useRef<any>(null);

  const tinymceApiKey =
    process.env.NEXT_PUBLIC_TINYMCE_API_KEY ||
    'voeyqzx2bjaswy0eg790bnp02w7tms530tbzbhzg103fle0l';

  const generateWithAI = async () => {
    setAiGenerating(true);
    setAiSuccess(null);
    setError(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const currentCourse = courses.find((c) => c.id === selectedCourseId);
      const currentUnits = currentCourse?.units || [];
      const currentUnit = currentUnits.find((u) => u.id === selectedUnitId) || currentUnits[0];
      const availableLessons = currentUnit?.lessons || [];
      const lessonTitle = availableLessons.find((l) => l.id === selectedLessonId)?.title || '';

      const result = await apiClient.post<{
        title: string;
        description: string;
        suggestedMaxScore: number;
        skillType: string;
      }>('/ai/assignments/generate', {
        skillType,
        cefrLevel: aiCefrLevel,
        topic: lessonTitle || title,
        lessonTitle,
        courseTitle: currentCourse?.title || '',
        instruction: aiInstruction.trim(),
      });

      // Auto-fill the form with AI output
      if (result.title) setTitle(result.title);
      if (result.description) {
        setDescription(result.description);
        // Push into TinyMCE if editor is mounted
        if (editorRef.current) {
          editorRef.current.setContent(result.description);
        }
      }
      if (result.suggestedMaxScore) setMaxScore(result.suggestedMaxScore);
      if (result.skillType) setSkillType(result.skillType);

      setAiSuccess(`✨ Assignment generated! Title, instructions and rubric have been filled in. Review and publish when ready.`);
      setAiPanelOpen(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('AI generation was stopped.');
      } else {
        setError(err.message || 'AI generation failed. Please try again.');
      }
    } finally {
      setAiGenerating(false);
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    setAiGenerating(false);
  };

  // Load teacher's courses (with units + lessons nested)
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await apiClient.get<CourseOption[]>('/teacher/courses');
        const list: CourseOption[] = Array.isArray(res) ? res : (res as any)?.data || [];
        setCourses(list);

        if (list.length > 0) {
          const target = list.find((c) => c.id === urlCourseId) || list[0];
          setSelectedCourseId(target.id);

          const firstUnit = target.units?.[0];
          if (firstUnit) {
            setSelectedUnitId(firstUnit.id);
            const targetLesson =
              firstUnit.lessons?.find((l) => l.id === urlLessonId) || firstUnit.lessons?.[0];
            if (targetLesson) setSelectedLessonId(targetLesson.id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, [urlCourseId, urlLessonId]);

  // Derived data
  const currentCourse = courses.find((c) => c.id === selectedCourseId);
  const currentUnits = currentCourse?.units || [];
  const currentUnit = currentUnits.find((u) => u.id === selectedUnitId) || currentUnits[0];
  const availableLessons = currentUnit?.lessons || [];

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId('');
    setSelectedUnitId('');
    const crs = courses.find((c) => c.id === courseId);
    const firstUnit = crs?.units?.[0];
    if (firstUnit) {
      setSelectedUnitId(firstUnit.id);
      if (firstUnit.lessons?.[0]) setSelectedLessonId(firstUnit.lessons[0].id);
    }
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedLessonId('');
    const unit = currentUnits.find((u) => u.id === unitId);
    if (unit?.lessons?.[0]) setSelectedLessonId(unit.lessons[0].id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Read content from TinyMCE editor
    const currentContent = editorRef.current
      ? editorRef.current.getContent()
      : description;

    if (!selectedLessonId) {
      setError('Please select a lesson to attach this assignment to.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for the assignment.');
      return;
    }
    if (!dueDate) {
      setError('Please set a submission deadline.');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await apiClient.post<
        { assignment: Assignment },
        { assignment: Assignment }
      >('/teacher/assignments', {
        lessonId: selectedLessonId,
        title: title.trim(),
        description: currentContent,
        skillType,
        maxScore: Number(maxScore),
        dueDate: new Date(dueDate).toISOString(),
      });

      // Explicitly update cache so the assignments page picks up the new assignment
      // Wrap in array to match the cache shape { assignments: Assignment[] }
      clientCache.set('teacher_assignments_page', { assignments: [data.assignment] }, 300_000);
      router.push('/teacher/assignments');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSkill = SKILL_CATEGORIES.find((s) => s.key === skillType);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href="/teacher/assignments">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Create Assignment
          </h1>
          <p className="text-xs text-slate-500">
            Link to a lesson, set the skill target, write the prompt, and publish to enrolled students.
          </p>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── AI success banner ── */}
      {aiSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{aiSuccess}</span>
          <button onClick={() => setAiSuccess(null)} className="ml-auto text-emerald-500 hover:text-emerald-700 text-[11px] underline">Dismiss</button>
        </div>
      )}

      {/* ── AI Assistant Panel ── */}
      <Card className={`overflow-hidden transition-all border-2 ${aiPanelOpen ? 'border-violet-300 dark:border-violet-700' : 'border-transparent'}`}>
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setAiPanelOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-violet-50 via-indigo-50 to-violet-50 dark:from-violet-950/40 dark:via-indigo-950/40 dark:to-violet-950/40 hover:from-violet-100 dark:hover:from-violet-950/70 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500 text-white shadow-sm">
              <Wand2 className="h-3.5 w-3.5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-violet-800 dark:text-violet-300">
                AI Assignment Generator
              </p>
              <p className="text-[10.5px] text-violet-600 dark:text-violet-400">
                Let AI create the title, detailed instructions &amp; rubric for you
              </p>
            </div>
            <Badge variant="outline" className="ml-2 text-[9px] font-bold border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-400">
              BETA
            </Badge>
          </div>
          {aiPanelOpen ? (
            <ChevronUp className="h-4 w-4 text-violet-500 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-violet-500 shrink-0" />
          )}
        </button>

        {/* Collapsible body */}
        {aiPanelOpen && (
          <div className="px-5 pb-5 pt-4 space-y-4 bg-white dark:bg-slate-950 border-t border-violet-100 dark:border-violet-900">
            {/* CEFR Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Student CEFR Level
              </label>
              <div className="flex flex-wrap gap-2">
                {CEFR_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setAiCefrLevel(lvl)}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all ${
                      aiCefrLevel === lvl
                        ? 'border-violet-500 bg-violet-500 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom instruction */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Additional Instructions <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                rows={3}
                placeholder="e.g. Focus on formal email writing, include a rubric for grammar, vocabulary and structure, set 250-word minimum..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 resize-none transition"
              />
              <p className="text-[10.5px] text-slate-400 mt-1">
                The AI will use the selected lesson, skill domain, and CEFR level as the base context.
              </p>
            </div>

            {/* Generate button */}
            <div className="flex items-center gap-3 pt-1">
              {aiGenerating ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={stopGeneration}
                  className="text-xs border-rose-300 text-rose-600 hover:bg-rose-50"
                >
                  <StopCircle className="h-3.5 w-3.5 mr-1.5" />
                  Stop Generation
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={generateWithAI}
                  disabled={!selectedLessonId}
                  className="text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-sm disabled:opacity-50"
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                  Generate with AI
                </Button>
              )}
              {aiGenerating && (
                <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Crafting your assignment...</span>
                </div>
              )}
              {!selectedLessonId && !aiGenerating && (
                <span className="text-[11px] text-slate-400">Select a lesson first to enable AI generation.</span>
              )}
            </div>
          </div>
        )}
      </Card>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── SECTION 1: Link to Course → Unit → Lesson ── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
            <Layers className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Curriculum Link
            </h2>
            <p className="text-xs text-slate-500 ml-1">— assign to a specific lesson</p>
          </div>

          {loadingCourses ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
              <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No courses yet</p>
              <p className="text-[11px] text-slate-400 mt-1">Create a course and add lessons before making assignments.</p>
              <Link href="/teacher/courses" className="mt-3 inline-block">
                <Button size="sm" variant="outline" className="text-xs">Go to Courses</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Course */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Course *
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.level}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Unit *
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition"
                >
                  {currentUnits.length === 0 ? (
                    <option value="">No units</option>
                  ) : (
                    currentUnits.map((u) => (
                      <option key={u.id} value={u.id}>{u.title}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Lesson */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lesson *
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition"
                >
                  {availableLessons.length === 0 ? (
                    <option value="">No lessons in this unit</option>
                  ) : (
                    availableLessons.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Breadcrumb preview */}
          {selectedCourseId && selectedLessonId && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
              <GraduationCap className="h-3.5 w-3.5 text-primary-500 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {currentCourse?.title}
              </span>
              <ChevronRight className="h-3 w-3" />
              <span>{currentUnit?.title}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-primary-600">
                {availableLessons.find((l) => l.id === selectedLessonId)?.title}
              </span>
              {currentCourse?.level && (
                <Badge variant="outline" className="ml-auto text-[9px] font-bold">
                  {currentCourse.level}
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* ── SECTION 2: Assignment Details ── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
            <ClipboardList className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Assignment Details</h2>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Essay: Pros and Cons of Remote Work"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition"
            />
          </div>

          {/* Skill Domain Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Skill Domain *
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {SKILL_CATEGORIES.map((skill) => {
                const Icon = skill.icon;
                const isSelected = skillType === skill.key;
                return (
                  <button
                    key={skill.key}
                    type="button"
                    onClick={() => setSkillType(skill.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
                      isSelected
                        ? skill.color + ' shadow-sm ring-2 ring-primary-500/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? '' : 'text-slate-400'}`} />
                    <span className={`text-[9px] font-bold leading-tight ${isSelected ? '' : 'text-slate-500'}`}>
                      {skill.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Max Score / Points *
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={maxScore}
                onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Submission Deadline *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition"
              />
            </div>
          </div>

          {/* TinyMCE editor — same config as lesson form */}
          <div className="flex items-center gap-2 pb-1">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Instructions, Prompt &amp; Rubric
            </h3>
            <span className="text-[10px] text-slate-400">
              — use rich formatting, tables, callouts
            </span>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
            <Editor
              apiKey={tinymceApiKey}
              tinymceScriptSrc={`https://cdn.tiny.cloud/1/${tinymceApiKey}/tinymce/8/tinymce.min.js`}
              onInit={(_evt: any, editor: any) => {
                editorRef.current = editor;
              }}
              initialValue={description}
              value={description}
              onEditorChange={(newContent: string) => setDescription(newContent)}
              init={{
                height: 450,
                menubar: 'file edit view insert format tools table help',
                plugins: [
                  'accordion',
                  'advlist',
                  'anchor',
                  'autolink',
                  'autoresize',
                  'autosave',
                  'charmap',
                  'code',
                  'codesample',
                  'emoticons',
                  'fullscreen',
                  'help',
                  'image',
                  'insertdatetime',
                  'link',
                  'lists',
                  'media',
                  'nonbreaking',
                  'preview',
                  'quickbars',
                  'searchreplace',
                  'table',
                  'visualblocks',
                  'wordcount',
                ],
                toolbar:
                  'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
                  'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
                  'link image table | forecolor backcolor removeformat | charmap emoticons | ' +
                  'code fullscreen preview',
                content_style:
                  'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; padding: 16px; } ' +
                  'img { max-width: 100%; height: auto; border-radius: 8px; } ' +
                  'table { border-collapse: collapse; width: 100%; margin: 12px 0; } ' +
                  'th, td { border: 1px solid #cbd5e1; padding: 8px 12px; } ' +
                  'th { background-color: #f8fafc; font-weight: 600; } ' +
                  'blockquote { border-left: 3px solid #3b82f6; margin: 12px 0; padding-left: 14px; color: #475569; font-style: italic; }',
                branding: false,
                promotion: false,
                placeholder:
                  skillType === 'WRITING'
                    ? 'Write 200–250 words arguing both perspectives. Include a rubric table with criteria for Grammar, Vocabulary, and Coherence...'
                    : skillType === 'SPEAKING'
                    ? 'Record a 2-minute spoken response. Include criteria for pronunciation, fluency, and vocabulary range...'
                    : 'Describe the task clearly. Include instructions, word/time limits, tips, and a marking rubric...',
              }}
            />
          </div>
        </Card>

        {/* ── SECTION 3: Summary card + Submit ── */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Summary pills */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              {selectedSkill && (
                <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 font-bold ${selectedSkill.color}`}>
                  <selectedSkill.icon className="h-3 w-3" />
                  {selectedSkill.label}
                </span>
              )}
              <span className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 font-bold text-slate-600 dark:text-slate-400">
                <Award className="h-3 w-3 text-amber-500" />
                {maxScore} pts
              </span>
              {dueDate && (
                <span className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 font-bold text-slate-600 dark:text-slate-400">
                  <Calendar className="h-3 w-3 text-primary-500" />
                  Due {new Date(dueDate).toLocaleDateString()}
                </span>
              )}
              {selectedLessonId && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
                  <CheckCircle2 className="h-3 w-3" />
                  Lesson linked
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link href="/teacher/assignments">
                <Button type="button" variant="outline" size="sm" className="text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="gradient"
                size="sm"
                className="text-xs"
                isLoading={submitting}
                disabled={submitting || !selectedLessonId || !title.trim()}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Publish Assignment
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default function TeacherCreateAssignmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading...</div>}>
      <CreateAssignmentForm />
    </Suspense>
  );
}
