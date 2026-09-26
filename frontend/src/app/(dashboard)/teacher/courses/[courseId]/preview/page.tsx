'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  Sparkles,
  FileText,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Bot,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ActivityContainer, ActivityData } from '@/components/activities/activity-container';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';
import { LessonBlock, LessonTab } from '@/components/lesson-builder/types';
import { MEDIA_WIDTH_CLASSES, MEDIA_ALIGN_CLASSES } from '@/components/lesson-builder/media-block-editors';
import { StudentPreview } from '@/components/lesson-builder/student-preview';

interface LessonSection {
  id: string;
  title: string;
  contentType: string;
  content: string;
  mediaUrl?: string;
  orderIndex?: number;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  skill: string;
  skills?: string[];
  estimatedMinutes: number;
  isFreePreview?: boolean;
  sections: LessonSection[];
}

interface Unit {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  units: Unit[];
}

export default function TeacherCoursePreviewSimulatorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const targetLessonId = searchParams.get('lessonId');

  const [course, setCourse] = useState<CourseData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'PRACTICE'>('CONTENT');
  const [loading, setLoading] = useState(true);

  // Full-screen Student Simulator Modal toggle
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isDrillSuccessModalOpen, setIsDrillSuccessModalOpen] = useState(false);

  // Lesson tabs state for current selected lesson
  const [activeLessonTabId, setActiveLessonTabId] = useState<string>('__all__');
  const [completedLessonTabs, setCompletedLessonTabs] = useState<Record<string, boolean>>({});

  // Interactive block states (Quiz, Flashcards, inner tabs)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [innerTabIndices, setInnerTabIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<CourseData>(`/teacher/courses/${courseId}`);
        if (res) {
          setCourse(res);

          // Find targeted lesson from query param or default to first lesson
          let foundLesson: Lesson | null = null;
          if (targetLessonId && res.units) {
            for (const u of res.units) {
              const matched = u.lessons?.find((l) => l.id === targetLessonId);
              if (matched) {
                foundLesson = matched;
                break;
              }
            }
          }

          if (!foundLesson && res.units?.length > 0 && res.units[0].lessons?.length > 0) {
            foundLesson = res.units[0].lessons[0];
          }

          if (foundLesson) {
            setSelectedLesson(foundLesson);
          }
        }
      } catch (err) {
        console.error('Failed to load course preview', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, targetLessonId]);

  // Parse modern lesson content JSON
  const parsedLesson = useMemo(() => {
    if (!selectedLesson) {
      return { blocks: [], tabs: [], objectives: [], isLegacyHtml: false };
    }

    const sections = selectedLesson.sections || [];
    if (sections.length > 0) {
      const raw = sections[0].content;
      if (raw && typeof raw === 'string' && raw.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.blocks)) {
            return {
              blocks: parsed.blocks as LessonBlock[],
              tabs: (parsed.tabs || []) as LessonTab[],
              objectives: (parsed.objectives || []) as string[],
              isLegacyHtml: false,
            };
          }
        } catch {
          // not JSON, fall through
        }
      }
    }

    return {
      blocks: [],
      tabs: [],
      objectives: [],
      isLegacyHtml: true,
    };
  }, [selectedLesson]);

  // Reset active tab when switching lessons
  useEffect(() => {
    if (parsedLesson.tabs && parsedLesson.tabs.length > 0) {
      setActiveLessonTabId(parsedLesson.tabs[0].id);
    } else {
      setActiveLessonTabId('__all__');
    }
    setQuizAnswers({});
    setQuizSubmitted({});
    setFlippedCards({});
  }, [selectedLesson?.id, parsedLesson.tabs]);

  // Filter blocks for active tab
  const displayedBlocks = useMemo(() => {
    const all = parsedLesson.blocks.filter((b) => b.visibility?.enabled !== false);
    if (parsedLesson.tabs.length === 0 || activeLessonTabId === '__all__') {
      return all;
    }
    const isFirstTab = parsedLesson.tabs[0]?.id === activeLessonTabId;
    return all.filter((b) => {
      if (b.tabId === activeLessonTabId) return true;
      if (!b.tabId && isFirstTab) return true;
      return false;
    });
  }, [parsedLesson.blocks, parsedLesson.tabs, activeLessonTabId]);

  const currentTabIdx = parsedLesson.tabs.findIndex((t) => t.id === activeLessonTabId);
  const prevTab = currentTabIdx > 0 ? parsedLesson.tabs[currentTabIdx - 1] : null;
  const nextTab =
    currentTabIdx >= 0 && currentTabIdx < parsedLesson.tabs.length - 1
      ? parsedLesson.tabs[currentTabIdx + 1]
      : null;

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse" />
        <Card className="h-96 animate-pulse bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white border border-[#e2ebe2] space-y-3">
        <p className="text-xs text-slate-500">Course not found.</p>
        <Link href="/teacher/courses">
          <Button variant="outline" size="sm">
            Back to Courses
          </Button>
        </Link>
      </div>
    );
  }

  // Interactive drill simulation for practice tab
  const simulatedActivity: ActivityData = {
    id: `prev-act-${selectedLesson?.id}`,
    title: `${selectedLesson?.skill || 'Grammar'} Interactive Drill (Simulator)`,
    type:
      selectedLesson?.skill === 'VOCABULARY'
        ? 'FLASHCARD'
        : selectedLesson?.skill === 'SPEAKING'
        ? 'SPEAKING_PRACTICE'
        : selectedLesson?.skill === 'READING'
        ? 'READING_PASSAGE'
        : 'FILL_BLANKS',
    skillType: selectedLesson?.skill || 'GRAMMAR',
    instructions: 'Previewing interactive drill student experience in non-destructive sandbox mode.',
    questions: [
      {
        id: 'q1',
        prompt: 'Select or fill in the best professional phrase to complete the statement.',
        options: ['We look forward to collaborating.', 'We will look forward.', 'We are looking.'],
        correctAnswer: 'We look forward to collaborating.',
        explanation: "'Look forward to' is followed by a noun or gerund (-ing form).",
      },
    ],
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Top Simulation Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#eff4ec] border border-[#d6ebd6] text-[#315b36]">
        <div className="flex items-center gap-2.5 text-xs font-bold">
          <Eye className="h-4 w-4 shrink-0 text-[#315b36]" />
          <span>
            <strong>Lesson Preview Mode:</strong> Viewing curriculum and media delivery as students experience it.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedLesson && parsedLesson.blocks.length > 0 && (
            <button
              onClick={() => setIsSimulatorModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Screen Simulator</span>
            </button>
          )}

          <Link href={`/studio/${courseId}`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-xl border-[#d6ebd6] text-[#315b36] hover:bg-[#e2ebe2]"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Exit Preview
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Main Layout Grid: Curriculum Sidebar + Lesson Viewer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Curriculum Sidebar (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-[#e2ebe2] p-5 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#315b36] bg-[#eff4ec] px-2.5 py-0.5 rounded-full border border-[#d6ebd6]">
                {course.level} Level
              </span>
              <h2 className="text-base font-black text-slate-900 mt-2 line-clamp-1">
                {course.title}
              </h2>
            </div>

            <div className="space-y-4 pt-1">
              {course.units.map((unit, uIdx) => (
                <div key={unit.id} className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Unit {uIdx + 1}: {unit.title}
                  </p>
                  <div className="space-y-1">
                    {unit.lessons.map((lesson) => {
                      const isSelected = selectedLesson?.id === lesson.id;
                      const skillsList =
                        Array.isArray(lesson.skills) && lesson.skills.length > 0
                          ? lesson.skills
                          : [lesson.skill || 'GRAMMAR'];

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setActiveTab('CONTENT');
                          }}
                          className={`w-full text-left p-3 rounded-2xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-[#315b36] text-white font-bold shadow-sm'
                              : 'bg-white border border-[#e2ebe2] text-slate-700 hover:bg-[#eff4ec]/50 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate flex-1">{lesson.title}</span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#eff4ec] text-[#315b36]'
                            }`}
                          >
                            {skillsList[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Modern Lesson Content Viewer (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedLesson ? (
            <div className="space-y-4">
              {/* Tab Switcher: Lesson Content vs Mastery Drill */}
              <div className="flex gap-2 border-b border-[#e2ebe2] pb-2">
                <button
                  onClick={() => setActiveTab('CONTENT')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'CONTENT'
                      ? 'bg-[#315b36] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-[#e2ebe2]'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>1. Lesson Material & Media</span>
                </button>

                <button
                  onClick={() => setActiveTab('PRACTICE')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'PRACTICE'
                      ? 'bg-[#315b36] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-[#e2ebe2]'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>2. Interactive Mastery Drill</span>
                </button>
              </div>

              {activeTab === 'CONTENT' ? (
                <div className="bg-white rounded-3xl border border-[#e2ebe2] overflow-hidden shadow-xs">
                  {/* Top Lesson Accent Line */}
                  <div className="h-1.5 bg-[#315b36] w-full" />

                  {/* Lesson Sections & Tabs Navigation (if tabs exist) */}
                  {parsedLesson.tabs.length > 0 && (
                    <div className="bg-[#fcfdfc] border-b border-[#e2ebe2] px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                        Sections:
                      </span>
                      {parsedLesson.tabs.map((tab, idx) => {
                        const isActive = activeLessonTabId === tab.id;
                        const isDone = completedLessonTabs[tab.id];

                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveLessonTabId(tab.id)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                              isActive
                                ? 'bg-[#315b36] text-white shadow-xs'
                                : 'bg-white border border-[#e2ebe2] text-slate-700 hover:text-slate-900 hover:bg-[#eff4ec]/50'
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-[#eff4ec] text-[#315b36]'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span>{tab.title}</span>
                            {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setActiveLessonTabId('__all__')}
                        className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                          activeLessonTabId === '__all__'
                            ? 'bg-slate-200 text-slate-800'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        All
                      </button>
                    </div>
                  )}

                  {/* Document Body */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Header */}
                    <div className="space-y-2 pb-4 border-b border-[#e2ebe2]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#eff4ec] text-[#315b36] px-2.5 py-0.5 rounded-full border border-[#d6ebd6]">
                            {selectedLesson.skill || 'Lesson'}
                          </span>
                          {selectedLesson.isFreePreview && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Free Preview
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-[#f8faf8] px-3 py-1 rounded-xl border border-[#e2ebe2]">
                          <Clock className="h-3.5 w-3.5 text-[#315b36]" />
                          <span>{selectedLesson.estimatedMinutes || 30} mins</span>
                        </div>
                      </div>

                      <h1 className="text-2xl font-black text-slate-900">
                        {selectedLesson.title}
                      </h1>
                    </div>

                    {/* Objectives */}
                    {parsedLesson.objectives.length > 0 && (
                      <div className="p-4 rounded-2xl bg-[#eff4ec]/70 border border-[#d6ebd6] space-y-2">
                        <p className="text-xs font-bold text-[#315b36] uppercase tracking-wider">
                          🎯 Learning Objectives
                        </p>
                        <ul className="space-y-1">
                          {parsedLesson.objectives.map((obj, i) => (
                            <li key={i} className="text-xs font-medium text-slate-700 flex items-start gap-2">
                              <span className="text-[#315b36] font-bold">•</span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ── PARSED MODERN LESSON BLOCKS ── */}
                    {parsedLesson.blocks.length > 0 ? (
                      <div className="space-y-6">
                        {displayedBlocks.map((block) => (
                          <div key={block.id}>
                            {/* Heading */}
                            {block.type === 'heading' && (
                              <h2
                                className={`font-black text-slate-900 ${
                                  block.content.level === 1 ? 'text-2xl' : 'text-xl'
                                }`}
                              >
                                {block.content.text}
                              </h2>
                            )}

                            {/* Text */}
                            {block.type === 'text' && (
                              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                                {block.content.text}
                              </p>
                            )}

                            {/* Callout */}
                            {block.type === 'callout' && (
                              <div className="p-4 rounded-2xl border border-emerald-200 bg-[#eff4ec]/70 text-slate-800 space-y-1">
                                <p className="text-xs font-bold text-[#315b36] uppercase">
                                  {block.content.title || 'Note'}
                                </p>
                                <p className="text-xs leading-relaxed text-slate-700">{block.content.text}</p>
                              </div>
                            )}

                            {/* Quote */}
                            {block.type === 'quote' && (
                              <blockquote className="border-l-4 border-[#315b36] pl-4 py-2 bg-[#f8faf8] rounded-r-xl space-y-1">
                                <p className="italic text-sm text-slate-800 font-serif">
                                  &quot;{block.content.quote}&quot;
                                </p>
                                {block.content.author && (
                                  <span className="block not-italic text-xs font-semibold text-slate-500">
                                    — {block.content.author}
                                  </span>
                                )}
                              </blockquote>
                            )}

                            {/* IMAGE BLOCK */}
                            {block.type === 'image' && block.content.url && (() => {
                              const layout = block.settings?.layout || 'stacked';
                              const width = block.settings?.width || 'full';
                              const align = block.settings?.align || 'center';
                              const objectFit = block.settings?.objectFit || 'contain';

                              const imgEl = (
                                <div className="space-y-2 w-full min-w-0">
                                  <div className="overflow-hidden rounded-2xl border border-[#e2ebe2] bg-[#f8faf8] flex items-center justify-center p-1">
                                    <img
                                      src={block.content.url}
                                      alt={block.content.alt || ''}
                                      className={`w-full rounded-xl ${
                                        objectFit === 'contain'
                                          ? 'max-h-[460px] object-contain'
                                          : 'max-h-[460px] object-cover'
                                      }`}
                                    />
                                  </div>
                                  {block.content.caption && (
                                    <p className="text-center text-xs text-slate-500 italic">
                                      {block.content.caption}
                                    </p>
                                  )}
                                </div>
                              );

                              const sideEl =
                                block.content.sideTitle || block.content.sideText ? (
                                  <div className="rounded-2xl border border-[#e2ebe2] bg-[#fbfcfb] p-5 space-y-2 shadow-xs">
                                    {block.content.sideTitle && (
                                      <h4 className="font-bold text-sm text-slate-900">
                                        {block.content.sideTitle}
                                      </h4>
                                    )}
                                    {block.content.sideText && (
                                      <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                                        {block.content.sideText}
                                      </p>
                                    )}
                                  </div>
                                ) : null;

                              if (layout === 'media-left' && sideEl) {
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start w-full min-w-0">
                                    <div className="md:col-span-6 w-full min-w-0">{imgEl}</div>
                                    <div className="md:col-span-6 w-full min-w-0">{sideEl}</div>
                                  </div>
                                );
                              }
                              if (layout === 'media-right' && sideEl) {
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start w-full min-w-0">
                                    <div className="md:col-span-6 w-full min-w-0 order-2 md:order-1">{sideEl}</div>
                                    <div className="md:col-span-6 w-full min-w-0 order-1 md:order-2">{imgEl}</div>
                                  </div>
                                );
                              }
                              return (
                                <div className={`flex w-full ${MEDIA_ALIGN_CLASSES[align]}`}>
                                  <div className={`w-full ${MEDIA_WIDTH_CLASSES[width]} min-w-0`}>
                                    {imgEl}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* VIDEO BLOCK */}
                            {block.type === 'video' && block.content.url && (() => {
                              const layout = block.settings?.layout || 'stacked';
                              const width = block.settings?.width || 'full';
                              const align = block.settings?.align || 'center';

                              const videoEl = (
                                <div className="space-y-2 w-full min-w-0">
                                  {block.content.title && (
                                    <h4 className="text-xs font-bold text-slate-900">
                                      {block.content.title}
                                    </h4>
                                  )}
                                  <div className="overflow-hidden rounded-2xl border border-[#e2ebe2] bg-black aspect-video relative shadow-xs">
                                    {block.content.url.includes('youtu') ? (
                                      <iframe
                                        src={
                                          block.content.url.includes('youtu.be/')
                                            ? `https://www.youtube.com/embed/${block.content.url.split('youtu.be/')[1]?.split(/[?#]/)[0]}`
                                            : `https://www.youtube.com/embed/${block.content.url.match(/v=([^&]+)/)?.[1] || ''}`
                                        }
                                        title={block.content.title || 'Lesson Video'}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full border-0"
                                      />
                                    ) : (
                                      <video controls src={block.content.url} className="w-full h-full object-contain" />
                                    )}
                                  </div>
                                </div>
                              );

                              return (
                                <div className={`flex w-full ${MEDIA_ALIGN_CLASSES[align]}`}>
                                  <div className={`w-full ${MEDIA_WIDTH_CLASSES[width]} min-w-0`}>
                                    {videoEl}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* AUDIO BLOCK */}
                            {block.type === 'audio' && (
                              <div className="rounded-2xl border border-[#e2ebe2] bg-[#f8faf8] p-4 space-y-3 w-full shadow-xs">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#315b36] text-white shadow-xs">
                                    <Volume2 className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-xs text-slate-900 truncate">
                                      {block.content.title || 'Audio Clip'}
                                    </p>
                                    {block.content.speaker && (
                                      <p className="text-[11px] text-slate-500 truncate">
                                        Speaker: {block.content.speaker}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {block.content.url ? (
                                  <audio controls src={block.content.url} className="w-full h-9 rounded-lg" />
                                ) : (
                                  <p className="text-xs text-slate-400 italic">No audio recorded.</p>
                                )}
                              </div>
                            )}

                            {/* TABBED CONTENT BOX */}
                            {block.type === 'tabs' && (() => {
                              const blockTabs = block.content.tabs || [];
                              const activeSubIdx = innerTabIndices[block.id] ?? 0;
                              const activeSubTab = blockTabs[activeSubIdx] || blockTabs[0];

                              return (
                                <div className="rounded-2xl border border-[#e2ebe2] bg-white shadow-xs overflow-hidden">
                                  <div className="flex items-center gap-1.5 p-2 bg-[#f8faf8] border-b border-[#e2ebe2] overflow-x-auto no-scrollbar">
                                    {blockTabs.map((tab: any, tIdx: number) => {
                                      const isSubActive = activeSubIdx === tIdx;
                                      return (
                                        <button
                                          key={tIdx}
                                          onClick={() =>
                                            setInnerTabIndices((prev) => ({ ...prev, [block.id]: tIdx }))
                                          }
                                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                            isSubActive
                                              ? 'bg-[#315b36] text-white shadow-xs'
                                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                          }`}
                                        >
                                          {tab.title || `Tab ${tIdx + 1}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="p-5">
                                    {activeSubTab ? (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-slate-900">{activeSubTab.title}</h4>
                                        <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                                          {activeSubTab.content}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 italic">No content in this tab.</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* QUIZ BLOCK */}
                            {block.type === 'quiz' && (
                              <div className="rounded-2xl border border-[#e2ebe2] bg-[#fcfdfc] p-6 space-y-4 shadow-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#315b36] uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4" /> Knowledge Check
                                  </span>
                                  <span className="text-xs font-semibold text-slate-400">
                                    {block.content.points || 10} Points
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-900">
                                  {block.content.question}
                                </h3>

                                <div className="space-y-2">
                                  {(block.content.options || []).map((opt: string, optIdx: number) => {
                                    const isSelected = quizAnswers[block.id] === optIdx;
                                    const isSubmitted = quizSubmitted[block.id];
                                    const isCorrect = block.content.correctAnswer === optIdx;

                                    let borderClass = 'border-[#e2ebe2] bg-white hover:border-slate-300';
                                    if (isSelected) borderClass = 'border-[#315b36] bg-[#eff4ec] font-semibold';
                                    if (isSubmitted) {
                                      if (isCorrect) borderClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                                      else if (isSelected) borderClass = 'border-rose-400 bg-rose-50 text-rose-900';
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        onClick={() => {
                                          if (!quizSubmitted[block.id]) {
                                            setQuizAnswers((prev) => ({ ...prev, [block.id]: optIdx }));
                                          }
                                        }}
                                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${borderClass}`}
                                      >
                                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                                          isSelected ? 'border-[#315b36] bg-[#315b36] text-white' : 'border-slate-300 text-slate-600'
                                        }`}>
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span>{opt}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {!quizSubmitted[block.id] ? (
                                  <button
                                    onClick={() => setQuizSubmitted((prev) => ({ ...prev, [block.id]: true }))}
                                    disabled={quizAnswers[block.id] === undefined}
                                    className="px-5 py-2.5 rounded-xl bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                                  >
                                    Check Answer
                                  </button>
                                ) : (
                                  <div className="p-3.5 rounded-xl bg-[#eff4ec] border border-[#d6ebd6] text-xs space-y-1">
                                    <p className="font-bold">
                                      {quizAnswers[block.id] === block.content.correctAnswer ? (
                                        <span className="text-emerald-700 flex items-center gap-1.5">
                                          <CheckCircle2 className="h-4 w-4" /> Correct! Excellent work!
                                        </span>
                                      ) : (
                                        <span className="text-rose-600">✕ Incorrect</span>
                                      )}
                                    </p>
                                    {block.content.explanation && (
                                      <p className="text-slate-600 pt-1">{block.content.explanation}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* FLASHCARDS BLOCK */}
                            {block.type === 'flashcards' && (
                              <div className="space-y-3">
                                <span className="text-xs font-bold text-[#315b36]">
                                  Flashcards (Click card to flip)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  {(block.content.cards || []).map((c: any, cIdx: number) => {
                                    const isFlipped = flippedCards[`${block.id}_${cIdx}`];
                                    return (
                                      <div
                                        key={cIdx}
                                        onClick={() =>
                                          setFlippedCards((prev) => ({
                                            ...prev,
                                            [`${block.id}_${cIdx}`]: !prev[`${block.id}_${cIdx}`],
                                          }))
                                        }
                                        className={`cursor-pointer p-6 rounded-2xl border transition-all min-h-[130px] flex flex-col justify-between shadow-xs ${
                                          isFlipped
                                            ? 'border-emerald-300 bg-[#eff4ec]/70'
                                            : 'border-[#e2ebe2] bg-[#fcfdfc] hover:border-slate-300'
                                        }`}
                                      >
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                          {isFlipped ? 'Answer' : 'Term'}
                                        </span>
                                        <p className="text-sm font-bold text-slate-900 my-2">
                                          {isFlipped ? c.back : c.front}
                                        </p>
                                        <span className="text-[10px] font-semibold text-[#315b36] text-right">
                                          Click to flip ↷
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* ── FALLBACK FOR LEGACY CONTENT (Proper media & HTML without raw JSON) ── */
                      <div className="space-y-5">
                        {selectedLesson.sections?.map((sec, idx) => {
                          const isImage =
                            sec.mediaUrl &&
                            (sec.mediaUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ||
                              sec.mediaUrl.includes('res.cloudinary.com') ||
                              sec.mediaUrl.includes('/images/'));

                          const isVideo =
                            sec.mediaUrl &&
                            (sec.contentType === 'VIDEO' ||
                              sec.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ||
                              sec.mediaUrl.includes('youtube') ||
                              sec.mediaUrl.includes('vimeo'));

                          const isAudio =
                            sec.mediaUrl &&
                            !isImage &&
                            !isVideo &&
                            (sec.contentType === 'AUDIO' || sec.mediaUrl.match(/\.(mp3|wav|ogg|m4a)$/i));

                          return (
                            <div key={sec.id || idx} className="space-y-4">
                              {/* Proper Media Renderer */}
                              {isImage && (
                                <div className="rounded-2xl overflow-hidden border border-[#e2ebe2] bg-[#f8faf8] p-2 flex items-center justify-center">
                                  <img
                                    src={sec.mediaUrl}
                                    alt={sec.title || ''}
                                    className="max-h-[460px] object-contain rounded-xl w-full"
                                  />
                                </div>
                              )}

                              {isVideo && (
                                <div className="rounded-2xl overflow-hidden border border-[#e2ebe2] bg-black aspect-video">
                                  {sec.mediaUrl?.includes('youtu') ? (
                                    <iframe
                                      src={sec.mediaUrl}
                                      className="w-full h-full border-0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  ) : (
                                    <video controls className="w-full h-full" src={sec.mediaUrl} />
                                  )}
                                </div>
                              )}

                              {isAudio && (
                                <div className="rounded-2xl border border-[#e2ebe2] bg-[#f8faf8] p-4">
                                  <audio controls className="w-full" src={sec.mediaUrl} />
                                </div>
                              )}

                              {/* Clean Rich Text / HTML */}
                              {!sec.content.trim().startsWith('{') && (
                                <RichTextRenderer content={sec.content} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── Tab Footer Controls (Previous / Next) ── */}
                    {parsedLesson.tabs.length > 0 && activeLessonTabId !== '__all__' && (
                      <div className="pt-8 border-t border-[#e2ebe2] flex items-center justify-between mt-8">
                        {prevTab ? (
                          <button
                            onClick={() => setActiveLessonTabId(prevTab.id)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d6ebd6] bg-[#eff4ec] text-[#315b36] font-bold text-xs hover:bg-[#e2ebe2] transition-all cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>Previous: {prevTab.title}</span>
                          </button>
                        ) : (
                          <div />
                        )}

                        {nextTab ? (
                          <button
                            onClick={() => {
                              setCompletedLessonTabs((prev) => ({
                                ...prev,
                                [activeLessonTabId]: true,
                              }));
                              setActiveLessonTabId(nextTab.id);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#315b36] hover:bg-[#254629] text-white font-bold text-xs transition-all shadow-md shadow-[#315b36]/20 cursor-pointer"
                          >
                            <span>Next: {nextTab.title}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#eff4ec] text-[#315b36] font-bold text-xs border border-[#cbe6cb]">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>All Sections Completed!</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <ActivityContainer
                    activity={simulatedActivity}
                    onComplete={() => setIsDrillSuccessModalOpen(true)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white border border-[#e2ebe2] space-y-2">
              <p className="text-xs text-slate-500">No lessons available in this course to preview.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Fullscreen Student Simulator Modal ── */}
      {isSimulatorModalOpen && selectedLesson && (
        <StudentPreview
          lessonTitle={selectedLesson.title}
          objectives={parsedLesson.objectives}
          blocks={parsedLesson.blocks}
          tabs={parsedLesson.tabs}
          onExitPreview={() => setIsSimulatorModalOpen(false)}
        />
      )}

      {/* ── Mastery Drill Completion Modal (Replaces JS alert) ── */}
      {isDrillSuccessModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsDrillSuccessModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#e2ebe2] text-center space-y-5 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsDrillSuccessModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36] border border-[#d6ebd6] shadow-sm">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#315b36] bg-[#eff4ec] px-3 py-1 rounded-full border border-[#d6ebd6]">
                Drill Simulator Complete
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Mastery Drill Completed!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Student interaction drill finished successfully in non-destructive sandbox mode.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e2ebe2] bg-[#f8faf8] p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Lesson:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{selectedLesson?.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Skill:</span>
                <span className="font-bold text-[#315b36]">{selectedLesson?.skill || 'GRAMMAR'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Result:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% Mastered
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDrillSuccessModalOpen(false);
                  setActiveTab('CONTENT');
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#d6ebd6] bg-[#eff4ec] hover:bg-[#e2ebe2] text-[#315b36] font-bold text-xs transition-all cursor-pointer"
              >
                Back to Material
              </button>

              <button
                type="button"
                onClick={() => setIsDrillSuccessModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#315b36] hover:bg-[#254629] text-white font-bold text-xs transition-all shadow-md shadow-[#315b36]/20 cursor-pointer active:scale-95"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
