'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Clock,
  Eye,
  AlertCircle,
  Save,
  Check,
  X,
  Layers,
  Wand2,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Editor } from '@tinymce/tinymce-react';

interface Unit {
  id: string;
  title: string;
  orderIndex: number;
}

const SKILL_OPTIONS = [
  { value: 'GRAMMAR', label: 'Grammar', icon: '📐' },
  { value: 'VOCABULARY', label: 'Vocabulary', icon: '📚' },
  { value: 'READING', label: 'Reading', icon: '📖' },
  { value: 'LISTENING', label: 'Listening', icon: '🎧' },
  { value: 'SPEAKING', label: 'Speaking', icon: '🗣️' },
  { value: 'WRITING', label: 'Writing', icon: '✍️' },
  { value: 'PRONUNCIATION', label: 'Pronunciation', icon: '🔊' },
];

export function LessonFormStudio({
  courseId,
  lessonId,
  initialUnitId,
  mode = 'create',
}: {
  courseId: string;
  lessonId?: string;
  initialUnitId?: string;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const editorRef = useRef<any>(null);

  // Course & Curriculum metadata
  const [courseTitle, setCourseTitle] = useState('Course');
  const [courseLevel, setCourseLevel] = useState('A1');
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Lesson Form State
  const [title, setTitle] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(initialUnitId || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['GRAMMAR']);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [isFreePreview, setIsFreePreview] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [content, setContent] = useState<string>('');

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // AI Assistant Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // TinyMCE API Key
  const tinymceApiKey =
    process.env.NEXT_PUBLIC_TINYMCE_API_KEY ||
    'voeyqzx2bjaswy0eg790bnp02w7tms530tbzbhzg103fle0l';

  // Toggle multi-select skill
  const toggleSkill = (skillVal: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skillVal)) {
        if (prev.length === 1) return prev; // Keep at least one skill
        return prev.filter((s) => s !== skillVal);
      } else {
        return [...prev, skillVal];
      }
    });
  };

  // Fetch Course details and existing Lesson if editing
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const courseRes = await apiClient.get<any>(`/teacher/courses/${courseId}`);
        if (!isMounted) return;

        if (courseRes) {
          setCourseTitle(courseRes.title || 'Course');
          if (courseRes.level) setCourseLevel(courseRes.level);
          if (courseRes.units && courseRes.units.length > 0) {
            setUnits(courseRes.units);
            if (!selectedUnitId) {
              const matchedUnit = initialUnitId
                ? courseRes.units.find((u: Unit) => u.id === initialUnitId)
                : courseRes.units[0];
              setSelectedUnitId(matchedUnit ? matchedUnit.id : courseRes.units[0].id);
            }
          }
        }

        // If edit mode, fetch lesson details
        if (mode === 'edit' && lessonId) {
          const lessonRes = await apiClient.get<any>(`/teacher/lessons/${lessonId}`);
          const lData = lessonRes?.data || lessonRes;
          if (!isMounted) return;

          if (lData) {
            setTitle(lData.title || '');
            const loadedSkills = Array.isArray(lData.skills) && lData.skills.length > 0
              ? lData.skills
              : [lData.skill || 'GRAMMAR'];
            setSelectedSkills(loadedSkills);
            setEstimatedMinutes(lData.estimatedMinutes || 30);
            setIsFreePreview(Boolean(lData.isFreePreview));
            setIsPublished(lData.isPublished !== undefined ? Boolean(lData.isPublished) : true);
            if (lData.unitId) setSelectedUnitId(lData.unitId);

            if (lData.sections && lData.sections.length > 0) {
              setContent(lData.sections[0].content || '');
            } else if (lData.description) {
              setContent(lData.description);
            }
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load curriculum data.');
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId, mode, initialUnitId]);

  // Handle AI Lesson Drafting
  const handleGenerateAiLesson = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Please enter a topic or instruction for the lesson.');
      return;
    }

    try {
      setAiDrafting(true);
      setAiError(null);

      const res = await apiClient.post<any>('/ai/lessons/draft', {
        prompt: aiPrompt.trim(),
        title: title.trim() || undefined,
        level: courseLevel,
        skills: selectedSkills,
      });

      const result = res?.data || res;
      if (result) {
        if (result.title && (!title || !title.trim())) {
          setTitle(result.title);
        }
        if (result.contentHtml) {
          setContent(result.contentHtml);
          if (editorRef.current) {
            editorRef.current.setContent(result.contentHtml);
          }
        }
        setShowAiModal(false);
        setAiPrompt('');
        setSuccessBanner('AI drafted your lesson content! You can now review, customize, or add notes in TinyMCE.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate lesson with AI.');
    } finally {
      setAiDrafting(false);
    }
  };

  // Handle Form Submission & DB Save
  const handleSubmit = async (publishStatus?: boolean) => {
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Please provide a lesson title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!selectedUnitId) {
      setError('Please select a parent unit for this lesson.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const currentContent = editorRef.current ? editorRef.current.getContent() : content;
    if (!currentContent || !currentContent.trim()) {
      setError('Please write lesson content using the rich text editor or click "Draft with AI".');
      return;
    }

    try {
      setSubmitting(true);
      const shouldPublish = publishStatus !== undefined ? publishStatus : isPublished;

      const payload = {
        title: title.trim(),
        description: currentContent.replace(/<[^>]+>/g, ' ').slice(0, 200).trim(),
        skill: selectedSkills[0] || 'GRAMMAR',
        skills: selectedSkills,
        estimatedMinutes: Number(estimatedMinutes) || 30,
        isFreePreview,
        isPublished: shouldPublish,
        sections: [
          {
            title: title.trim(),
            contentType: 'MARKDOWN',
            content: currentContent,
            orderIndex: 1,
          },
        ],
      };

      if (mode === 'edit' && lessonId) {
        await apiClient.patch(`/teacher/lessons/${lessonId}`, payload);
        setSuccessBanner('Lesson updated and saved in database successfully!');
      } else {
        await apiClient.post(
          `/teacher/courses/${courseId}/units/${selectedUnitId}/lessons`,
          payload
        );
        setSuccessBanner('Lesson created and saved in database successfully!');
      }

      // Navigate back to course curriculum after brief delay
      setTimeout(() => {
        router.push(`/teacher/courses/${courseId}/units`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson. Please check all fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center space-y-3 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
        <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-md mx-auto" />
        <div className="h-96 w-full bg-slate-100 dark:bg-slate-800/40 rounded-2xl mt-6" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-fade-in">
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href={`/teacher/courses/${courseId}/units`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Back to Curriculum"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="indigo" className="font-bold text-xs">
                Level {courseLevel}
              </Badge>
              <span className="text-xs text-slate-500 font-medium truncate max-w-[280px]">
                {courseTitle}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-600" />
              {mode === 'edit' ? 'Edit Lesson' : 'Create New Lesson'}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* AI Draft Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAiModal(true)}
            className="h-9 px-3.5 text-xs font-bold border-purple-200 bg-purple-50/70 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 shadow-xs"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-purple-600 animate-pulse" />
            Draft with AI
          </Button>

          <Link href={`/teacher/courses/${courseId}/units`}>
            <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold">
              Cancel
            </Button>
          </Link>

          <Button
            type="button"
            variant="gradient"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit()}
            className="h-9 px-4 text-xs font-bold shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Publish Lesson'}
          </Button>
        </div>
      </div>

      {/* 2. SUCCESS & ERROR ALERTS */}
      {successBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-destructive/60 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3. LESSON DETAILS & METADATA CARD */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        {/* Title Input */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Lesson Title <span className="text-rose-500">*</span></span>
            <span className="text-[11px] font-normal text-slate-400">Topic or module title</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master Conditional Sentences: Real vs Hypothetical Situations"
            className="mt-1.5 text-sm font-semibold h-11"
            required
            autoFocus
          />
        </div>

        {/* Multi-Select Skill Focus */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Skill Focus <span className="text-rose-500">*</span>{' '}
              <span className="text-[11px] font-normal text-slate-400">
                (Choose one or multiple skills for this lesson)
              </span>
            </label>
            <span className="text-[11px] text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded-md">
              {selectedSkills.length} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((opt) => {
              const isSelected = selectedSkills.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleSkill(opt.value)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer select-none',
                    isSelected
                      ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-950 dark:border-primary-400 dark:text-primary-300 shadow-xs ring-1 ring-primary-400/30'
                      : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                  )}
                >
                  <span className="text-sm">{opt.icon}</span>
                  <span>{opt.label}</span>
                  {isSelected ? (
                    <Check className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 ml-0.5" />
                  ) : (
                    <span className="h-3.5 w-3.5 block" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Row: Unit, Duration, Visibility Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Parent Unit */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Curriculum Unit <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-medium"
            >
              {units.length === 0 ? (
                <option value="">No units created yet</option>
              ) : (
                units.map((u, idx) => (
                  <option key={u.id} value={u.id}>
                    Unit {idx + 1}: {u.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Estimated Study Duration */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Estimated Study Time (Minutes)
            </label>
            <Input
              type="number"
              min="5"
              step="5"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 30)}
              className="h-9 text-xs"
            />
          </div>

          {/* Visibility Toggles */}
          <div className="flex flex-col justify-center space-y-2 pt-1 sm:pt-0">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Published & Visible to Students</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Allow Free Sample Preview</span>
            </label>
          </div>
        </div>
      </Card>

      {/* 4. TINYMCE RICH TEXT EDITOR CARD */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              Lesson Content & Learning Materials
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Type your content directly or use the AI Assistant to generate complete explanations, grammar tables, and dialogues.
            </p>
          </div>

          {/* Quick AI Trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAiModal(true)}
            className="text-xs font-bold border-purple-200 bg-purple-50/50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 self-start sm:self-auto"
          >
            <Wand2 className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
            AI Write in Editor
          </Button>
        </div>

        {/* TinyMCE 8 Editor Container */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
          <Editor
            apiKey={tinymceApiKey}
            tinymceScriptSrc={`https://cdn.tiny.cloud/1/${tinymceApiKey}/tinymce/8/tinymce.min.js`}
            onInit={(_evt: any, editor: any) => {
              editorRef.current = editor;
            }}
            initialValue={content}
            value={content}
            onEditorChange={(newContent: string) => setContent(newContent)}
            init={{
              height: 550,
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
                'directionality',
                'emoticons',
                'fullscreen',
                'help',
                'image',
                'importcss',
                'insertdatetime',
                'link',
                'lists',
                'media',
                'nonbreaking',
                'pagebreak',
                'preview',
                'quickbars',
                'save',
                'searchreplace',
                'table',
                'visualblocks',
                'visualchars',
                'wordcount',
              ],
              toolbar:
                'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
                'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
                'link image media table | forecolor backcolor removeformat | charmap emoticons | ' +
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
                'Write your lesson notes, grammar formulas, sample dialogues, vocabulary charts, or use AI to draft it...',
            }}
          />
        </div>
      </Card>

      {/* 5. FOOTER SAVE ACTIONS */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <Link href={`/teacher/courses/${courseId}/units`}>
          <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-semibold">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Curriculum
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="h-9 px-4 text-xs font-semibold"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save as Draft
          </Button>

          <Button
            type="button"
            variant="gradient"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="h-9 px-5 text-xs font-bold shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {submitting ? 'Saving...' : mode === 'edit' ? 'Save & Update in DB' : 'Save & Publish to DB'}
          </Button>
        </div>
      </div>

      {/* 6. AI LESSON DRAFTING MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-xl w-full p-6 space-y-4 shadow-2xl border-purple-200 dark:border-purple-900/60">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    AI Lesson Drafter
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Provide a prompt and AI will compose the complete lesson in TinyMCE for you
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Context Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Context:</span>
              <Badge variant="indigo" className="text-[10px]">
                Level {courseLevel}
              </Badge>
              {selectedSkills.map((sk) => (
                <Badge key={sk} variant="outline" className="text-[10px]">
                  {sk}
                </Badge>
              ))}
            </div>

            {/* Prompt Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Prompt / Lesson Instructions <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Create a comprehensive lesson explaining Past Continuous vs Past Simple with real-world workplace dialogues, a grammar comparison table, and 3 practice quiz questions with answer keys."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white leading-relaxed"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: The more specific you are (e.g. including dialogues, rules, tables, or exercises), the richer the lesson.
              </p>
            </div>

            {aiError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={aiDrafting}
                onClick={() => setShowAiModal(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="gradient"
                size="sm"
                disabled={aiDrafting}
                onClick={handleGenerateAiLesson}
                className="font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                {aiDrafting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    AI Composing Lesson...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                    Generate & Insert into Editor
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
