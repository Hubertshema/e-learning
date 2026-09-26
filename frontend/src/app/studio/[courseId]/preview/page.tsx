'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCcw,
  BookOpen,
  Layers,
  HelpCircle,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
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

export default function StudioCoursePreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const targetLessonId = searchParams.get('lessonId');

  const [course, setCourse] = useState<CourseData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  // Lesson tabs state for current selected lesson
  const [activeLessonTabId, setActiveLessonTabId] = useState<string>('__all__');
  const [completedLessonTabs, setCompletedLessonTabs] = useState<Record<string, boolean>>({});

  // Fullscreen modal state
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);

  // Completion modal state
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  // Interactive block states (Quiz, Flashcards, inner tabs)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [innerTabIndices, setInnerTabIndices] = useState<Record<string, number>>({});
  const [activeFlashcardIndices, setActiveFlashcardIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<CourseData>(`/teacher/courses/${courseId}`);
        if (res) {
          setCourse(res);

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
    setActiveFlashcardIndices({});
    setCompletedLessonTabs({});
  }, [selectedLesson?.id, parsedLesson.tabs]);

  // Filter blocks for active tab
  const displayedBlocks = useMemo(() => {
    const all = parsedLesson.blocks.filter((b) => b.visibility?.enabled !== false);
    if (parsedLesson.tabs.length === 0 || activeLessonTabId === '__all__' || parsedLesson.isLegacyHtml) {
      return all;
    }
    const isFirstTab = parsedLesson.tabs[0]?.id === activeLessonTabId;
    return all.filter((b) => {
      if (b.tabId === activeLessonTabId) return true;
      if (!b.tabId && isFirstTab) return true;
      return false;
    });
  }, [parsedLesson.blocks, parsedLesson.tabs, activeLessonTabId, parsedLesson.isLegacyHtml]);

  const currentTabIdx = parsedLesson.tabs.findIndex((t) => t.id === activeLessonTabId);
  const prevTab = currentTabIdx > 0 ? parsedLesson.tabs[currentTabIdx - 1] : null;
  const nextTab =
    currentTabIdx >= 0 && currentTabIdx < parsedLesson.tabs.length - 1
      ? parsedLesson.tabs[currentTabIdx + 1]
      : null;

  // Flatten all lessons across all units for the lesson selector dropdown
  const allLessons = useMemo(() => {
    if (!course?.units) return [];
    return course.units.flatMap((u) => u.lessons || []);
  }, [course]);

  // Overall lesson progress calculation
  const totalTabsCount = Math.max(1, parsedLesson.tabs.length > 0 ? parsedLesson.tabs.length : 1);
  const completedTabsCount = Object.keys(completedLessonTabs).length;
  const progressPercent = Math.min(100, Math.round((completedTabsCount / totalTabsCount) * 100));

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex items-center gap-3 text-xs font-bold text-[#315b36]">
          <span className="h-5 w-5 rounded-full border-2 border-[#315b36] border-t-transparent animate-spin" />
          <span>Loading Course Preview...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-96 w-full items-center justify-center p-6">
        <div className="p-8 text-center rounded-3xl bg-white border border-[#e2ebe2] space-y-4 max-w-md shadow-xs">
          <p className="text-sm font-bold text-slate-800">Course not found</p>
          <Link href={`/studio/${courseId}`}>
            <button className="px-4 py-2 rounded-xl bg-[#315b36] text-white text-xs font-bold hover:bg-[#254629] transition-colors cursor-pointer">
              Back to Studio
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar within Studio View ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#e2ebe2] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff4ec] border border-[#d6ebd6] text-xs font-bold text-[#315b36]">
              <Sparkles className="h-3.5 w-3.5" />
              Student Simulator
            </span>
          </div>

          <div className="h-5 w-px bg-[#e2ebe2] hidden sm:block" />

          {/* Lesson Switcher Dropdown */}
          {allLessons.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">Lesson:</span>
              <select
                value={selectedLesson?.id || ''}
                onChange={(e) => {
                  const target = allLessons.find((l) => l.id === e.target.value);
                  if (target) setSelectedLesson(target);
                }}
                className="text-xs font-bold text-slate-800 bg-[#f8faf8] border border-[#e2ebe2] rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-slate-300 max-w-[240px] sm:max-w-xs truncate"
              >
                {course.units.map((u, uIdx) => (
                  <optgroup key={u.id} label={`Unit ${uIdx + 1}: ${u.title}`}>
                    {u.lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right side controls: Fullscreen button & Progress */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
              <span className="text-xs font-black text-[#315b36]">{progressPercent}%</span>
            </div>
            <div className="w-20 sm:w-28 bg-[#e2ebe2] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#315b36] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {selectedLesson && (
            <button
              onClick={() => setIsFullscreenModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eff4ec] hover:bg-[#e2ebe2] text-[#315b36] border border-[#d6ebd6] text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              title="Open full-screen student simulator"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Fullscreen Simulator</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Simulator Viewer Container ── */}
      {selectedLesson ? (
        <div className="w-full bg-white border border-[#e2ebe2] rounded-3xl shadow-sm overflow-hidden flex flex-col">
          {/* Top Accent Line */}
          <div className="w-full bg-[#eef5ee] h-1.5">
            <div
              className="bg-[#315b36] h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* ── Tabs Navigation Bar (If tabs exist) ── */}
          {parsedLesson.tabs.length > 0 && (
            <div className="bg-[#fcfdfc] border-b border-[#e2ebe2] px-6 sm:px-10 py-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#315b36] text-white shadow-sm shadow-[#315b36]/20'
                        : 'bg-white border border-[#e2ebe2] text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-[#eff4ec]/50'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
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
                className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                  activeLessonTabId === '__all__'
                    ? 'bg-slate-200 text-slate-800'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                All Sections
              </button>
            </div>
          )}

          {/* Document Content Body */}
          <div className="p-6 sm:p-10 space-y-8 flex-1">
            {/* Header (shown on first tab or all view) */}
            {(activeLessonTabId === '__all__' ||
              (parsedLesson.tabs.length > 0 && activeLessonTabId === parsedLesson.tabs[0]?.id) ||
              parsedLesson.tabs.length === 0) && (
              <div className="space-y-3 pb-6 border-b border-[#e2ebe2]">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ec] text-[#315b36] border border-[#d6ebd6] px-3.5 py-1 text-xs font-bold">
                    <span>{selectedLesson.skill || 'Interactive Lesson'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-[#f8faf8] px-3 py-1 rounded-xl border border-[#e2ebe2]">
                    <Clock className="h-3.5 w-3.5 text-[#315b36]" />
                    <span>{selectedLesson.estimatedMinutes || 30} mins</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {selectedLesson.title}
                </h1>
                {selectedLesson.description && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {selectedLesson.description}
                  </p>
                )}

                {/* Learning Objectives Pill List */}
                {parsedLesson.objectives.length > 0 && (
                  <div className="pt-4 mt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#315b36]" />
                      Learning Objectives & Outcomes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {parsedLesson.objectives.map((obj, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 rounded-xl border border-[#e2ebe2] bg-[#f8faf8] p-3 text-xs text-slate-700 shadow-2xs"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                          <span className="leading-snug">{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Block Contents (Modern Interactive Engine) ── */}
            {!parsedLesson.isLegacyHtml && displayedBlocks.length > 0 && (
              <div className="space-y-6">
                {displayedBlocks.map((block) => {
                  return (
                    <div key={block.id} className="space-y-2">
                      {/* TEXT BLOCK */}
                      {block.type === 'text' && (
                        <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed">
                          <RichTextRenderer content={block.content.text || ''} />
                        </div>
                      )}

                      {/* IMAGE BLOCK */}
                      {block.type === 'image' && block.content.url && (() => {
                        const layout = block.settings?.layout || 'stacked';
                        const width = block.settings?.width || 'full';
                        const align = block.settings?.align || 'center';

                        const imageEl = (
                          <div className="space-y-2 w-full min-w-0">
                            <div className="overflow-hidden rounded-2xl border border-[#e2ebe2] bg-[#f8faf8] p-2 flex items-center justify-center shadow-xs">
                              <img
                                src={block.content.url}
                                alt={block.content.alt || block.content.caption || 'Lesson visual'}
                                className="max-h-[460px] object-contain rounded-xl w-full"
                              />
                            </div>
                            {block.content.caption && (
                              <p className="text-[11px] text-slate-500 italic text-center">
                                {block.content.caption}
                              </p>
                            )}
                          </div>
                        );

                        if (layout === 'media-left') {
                          return (
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                              <div className={`w-full md:w-1/2 shrink-0 ${MEDIA_WIDTH_CLASSES[width]}`}>
                                {imageEl}
                              </div>
                              <div className="flex-1 min-w-0 prose prose-slate">
                                <RichTextRenderer content={block.content.caption || ''} />
                              </div>
                            </div>
                          );
                        }
                        if (layout === 'media-right') {
                          return (
                            <div className="flex flex-col md:flex-row-reverse gap-6 items-start">
                              <div className={`w-full md:w-1/2 shrink-0 ${MEDIA_WIDTH_CLASSES[width]}`}>
                                {imageEl}
                              </div>
                              <div className="flex-1 min-w-0 prose prose-slate">
                                <RichTextRenderer content={block.content.caption || ''} />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className={`flex w-full ${MEDIA_ALIGN_CLASSES[align]}`}>
                            <div className={`w-full ${MEDIA_WIDTH_CLASSES[width]} min-w-0`}>
                              {imageEl}
                            </div>
                          </div>
                        );
                      })()}

                      {/* VIDEO BLOCK */}
                      {block.type === 'video' && block.content.url && (() => {
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
                            <div className="p-5 text-xs text-slate-700 leading-relaxed">
                              {activeSubTab?.content ? (
                                <RichTextRenderer content={activeSubTab.content} />
                              ) : (
                                <span className="italic text-slate-400">Empty tab content</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* FLASHCARD BLOCK */}
                      {(block.type === 'flashcards' || (block.type as string) === 'flashcard') && (() => {
                        const cards = block.content.cards || [];
                        if (cards.length === 0) return null;
                        const currentCardIdx = activeFlashcardIndices[block.id] ?? 0;
                        const currentCard = cards[currentCardIdx] || cards[0];
                        const isFlipped = flippedCards[`${block.id}-${currentCardIdx}`];

                        return (
                          <div className="rounded-3xl border border-[#e2ebe2] bg-[#f8faf8] p-6 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#315b36] bg-[#eff4ec] px-3 py-1 rounded-full border border-[#d6ebd6]">
                                Card {currentCardIdx + 1} of {cards.length}
                              </span>
                              <span className="text-[11px] text-slate-400">Click to flip</span>
                            </div>

                            <div
                              onClick={() =>
                                setFlippedCards((prev) => ({
                                  ...prev,
                                  [`${block.id}-${currentCardIdx}`]: !prev[`${block.id}-${currentCardIdx}`],
                                }))
                              }
                              className="min-h-[160px] bg-white rounded-2xl border border-[#e2ebe2] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-300 hover:shadow-xs transition-all select-none"
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                {isFlipped ? 'Back / Meaning' : 'Front / Term'}
                              </span>
                              <p className="text-base sm:text-lg font-bold text-slate-800">
                                {isFlipped ? currentCard.back : currentCard.front}
                              </p>
                              {isFlipped && currentCard.hint && (
                                <p className="text-xs text-slate-500 mt-2 italic">
                                  Hint: {currentCard.hint}
                                </p>
                              )}
                            </div>

                            {cards.length > 1 && (
                              <div className="flex items-center justify-between pt-2">
                                <button
                                  disabled={currentCardIdx === 0}
                                  onClick={() =>
                                    setActiveFlashcardIndices((prev) => ({
                                      ...prev,
                                      [block.id]: Math.max(0, currentCardIdx - 1),
                                    }))
                                  }
                                  className="px-3 py-1.5 rounded-xl border border-[#d6ebd6] bg-[#eff4ec] text-[#315b36] font-bold text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  Previous
                                </button>
                                <button
                                  disabled={currentCardIdx === cards.length - 1}
                                  onClick={() =>
                                    setActiveFlashcardIndices((prev) => ({
                                      ...prev,
                                      [block.id]: Math.min(cards.length - 1, currentCardIdx + 1),
                                    }))
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-[#315b36] text-white font-bold text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* QUIZ BLOCK */}
                      {block.type === 'quiz' && (() => {
                        const selectedAnswer = quizAnswers[block.id];
                        const isSubmitted = quizSubmitted[block.id];
                        const isCorrect = selectedAnswer === block.content.correctAnswer;

                        return (
                          <div className="rounded-3xl border border-[#e2ebe2] bg-[#f8faf8] p-6 space-y-4 shadow-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#315b36] bg-[#eff4ec] px-3 py-1 rounded-full border border-[#d6ebd6]">
                                Knowledge Check
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-800">
                              {block.content.question || 'Select the correct answer:'}
                            </h4>

                            <div className="space-y-2">
                              {(block.content.options || []).map((opt: string, optIdx: number) => {
                                const isSelected = selectedAnswer === optIdx;
                                let btnStyle =
                                  'bg-white border-[#e2ebe2] text-slate-700 hover:border-slate-300';
                                if (isSubmitted) {
                                  if (optIdx === block.content.correctAnswer) {
                                    btnStyle =
                                      'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                                  } else if (isSelected) {
                                    btnStyle = 'bg-rose-50 border-rose-500 text-rose-900 line-through';
                                  } else {
                                    btnStyle = 'bg-white border-[#e2ebe2] text-slate-400 opacity-60';
                                  }
                                } else if (isSelected) {
                                  btnStyle =
                                    'bg-[#eff4ec] border-[#315b36] text-[#315b36] font-bold shadow-2xs';
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    disabled={isSubmitted}
                                    onClick={() =>
                                      setQuizAnswers((prev) => ({ ...prev, [block.id]: optIdx }))
                                    }
                                    className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                                  >
                                    <span>{opt}</span>
                                    {isSubmitted && optIdx === block.content.correctAnswer && (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {!isSubmitted ? (
                              <button
                                disabled={selectedAnswer === undefined}
                                onClick={() =>
                                  setQuizSubmitted((prev) => ({ ...prev, [block.id]: true }))
                                }
                                className="px-5 py-2.5 rounded-xl bg-[#315b36] hover:bg-[#254629] text-white font-bold text-xs disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
                              >
                                Check Answer
                              </button>
                            ) : (
                              <div
                                className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                                }`}
                              >
                                {isCorrect ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                                )}
                                <div>
                                  <span className="font-bold">
                                    {isCorrect ? 'Correct!' : 'Incorrect.'}{' '}
                                  </span>
                                  <span>{block.content.explanation || ''}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Legacy Sections Fallback (Rendered Cleanly, No Raw JSON, No Audio Bug) ── */}
            {parsedLesson.isLegacyHtml && (
              <div className="space-y-6">
                {(selectedLesson.sections || []).map((sec, idx) => {
                  const isImage =
                    sec.mediaUrl &&
                    (sec.contentType === 'IMAGE' ||
                      sec.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ||
                      sec.mediaUrl.includes('/image/upload/'));

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
                  <button
                    onClick={() => {
                      setCompletedLessonTabs((prev) => ({
                        ...prev,
                        [activeLessonTabId]: true,
                      }));
                      setIsCompletedModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Finish Lesson</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#e2ebe2] space-y-2">
          <p className="text-xs text-slate-500">No lessons available in this course to preview.</p>
        </div>
      )}

      {/* ── Fullscreen Student Simulator Modal ── */}
      {isFullscreenModalOpen && selectedLesson && (
        <StudentPreview
          lessonTitle={selectedLesson.title}
          objectives={parsedLesson.objectives}
          blocks={parsedLesson.blocks}
          tabs={parsedLesson.tabs}
          onExitPreview={() => setIsFullscreenModalOpen(false)}
        />
      )}

      {/* ── Lesson Completion Celebration Modal (Replaces browser alert) ── */}
      {isCompletedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsCompletedModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#e2ebe2] text-center space-y-5 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsCompletedModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36] border border-[#d6ebd6] shadow-sm">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#315b36] bg-[#eff4ec] px-3 py-1 rounded-full border border-[#d6ebd6]">
                Simulation Complete
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Lesson Completed!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                All sections and interactive materials were successfully reviewed in student mode.
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
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% Completed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCompletedModalOpen(false);
                  if (parsedLesson.tabs.length > 0) {
                    setActiveLessonTabId(parsedLesson.tabs[0].id);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#d6ebd6] bg-[#eff4ec] hover:bg-[#e2ebe2] text-[#315b36] font-bold text-xs transition-all cursor-pointer"
              >
                Review Material
              </button>

              <button
                type="button"
                onClick={() => setIsCompletedModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#315b36] hover:bg-[#254629] text-white font-bold text-xs transition-all shadow-md shadow-[#315b36]/20 cursor-pointer active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
