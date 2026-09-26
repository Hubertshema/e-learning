'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Bot,
  Layers,
  Code as CodeIcon,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { LessonBlock, LessonTab } from './types';
import { MEDIA_WIDTH_CLASSES, MEDIA_ALIGN_CLASSES } from './media-block-editors';

interface StudentPreviewProps {
  lessonTitle: string;
  objectives: string[];
  blocks: LessonBlock[];
  tabs?: LessonTab[];
  onExitPreview: () => void;
}

export function StudentPreview({
  lessonTitle,
  objectives,
  blocks,
  tabs = [],
  onExitPreview,
}: StudentPreviewProps) {
  // Active Tab state for lesson-level tabs
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    return tabs.length > 0 ? tabs[0].id : '__all__';
  });

  // Track completed tabs
  const [completedTabs, setCompletedTabs] = useState<Record<string, boolean>>({});

  // Interactive block states
  const [activeFlashcardIndices, setActiveFlashcardIndices] = useState<Record<string, number>>({});
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [completedBlocks, setCompletedBlocks] = useState<Record<string, boolean>>({});
  const [innerTabIndices, setInnerTabIndices] = useState<Record<string, number>>({});

  const toggleFlip = (cardKey: string) => {
    setFlippedCards((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };

  const handleSelectQuiz = (blockId: string, optionIndex: number) => {
    if (quizSubmitted[blockId]) return;
    setQuizAnswers((prev) => ({ ...prev, [blockId]: optionIndex }));
  };

  const handleSubmitQuiz = (blockId: string) => {
    setQuizSubmitted((prev) => ({ ...prev, [blockId]: true }));
    setCompletedBlocks((prev) => ({ ...prev, [blockId]: true }));
  };

  // Determine active tab blocks
  const visibleBlocks = blocks.filter((b) => b.visibility?.enabled !== false);

  const displayedBlocks = React.useMemo(() => {
    if (tabs.length === 0 || activeTabId === '__all__') {
      return visibleBlocks;
    }
    // Return blocks assigned to current tab, or untabbed blocks if on the first tab
    const isFirstTab = tabs[0]?.id === activeTabId;
    return visibleBlocks.filter((b) => {
      if (b.tabId === activeTabId) return true;
      if (!b.tabId && isFirstTab) return true;
      return false;
    });
  }, [visibleBlocks, tabs, activeTabId]);

  // Tab navigation indexes
  const currentTabIdx = tabs.findIndex((t) => t.id === activeTabId);
  const prevTab = currentTabIdx > 0 ? tabs[currentTabIdx - 1] : null;
  const nextTab = currentTabIdx >= 0 && currentTabIdx < tabs.length - 1 ? tabs[currentTabIdx + 1] : null;

  // Calculate overall lesson progress
  const totalItems = Math.max(1, (tabs.length > 0 ? tabs.length : visibleBlocks.length) + (objectives.length > 0 ? 1 : 0));
  const completedCount =
    (tabs.length > 0 ? Object.keys(completedTabs).length : Object.keys(completedBlocks).length) +
    (objectives.length > 0 ? 1 : 0);
  const progressPercent = Math.min(100, Math.round((completedCount / totalItems) * 100));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f8faf8] text-slate-800 overflow-hidden font-sans">
      {/* ── Top Header Navigation Bar (LinguaChris Brand Colors) ── */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#e2ebe2] bg-white px-4 sm:px-8 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitPreview}
            className="flex items-center gap-2 rounded-xl bg-[#eff4ec] hover:bg-[#e2ebe2] text-[#315b36] border border-[#d6ebd6] px-3.5 py-2 text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Editor</span>
          </button>
          <div className="h-5 w-px bg-[#e2ebe2] hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff4ec] border border-[#d6ebd6] text-xs font-bold text-[#315b36]">
              <Sparkles className="h-3.5 w-3.5" />
              Lesson Delivery Mode
            </span>
            <span className="text-xs font-bold text-slate-600 hidden md:inline truncate max-w-sm">
              {lessonTitle || 'Untitled Lesson'}
            </span>
          </div>
        </div>

        {/* Right: Progress Indicator */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion</span>
            <span className="text-xs font-black text-[#315b36]">{progressPercent}%</span>
          </div>
          <div className="w-24 sm:w-36 bg-[#e2ebe2] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#315b36] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* ── Main Preview Area ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center bg-[#f8faf8]">
        <div className="w-full max-w-4xl bg-white border border-[#e2ebe2] rounded-3xl shadow-sm overflow-hidden min-h-[calc(100vh-130px)] flex flex-col mb-12">
          {/* Top Progress Accent Bar */}
          <div className="w-full bg-[#eef5ee] h-1.5">
            <div
              className="bg-[#315b36] h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* ── Teacher Tab Navigation Bar (When Tabs are created) ── */}
          {tabs.length > 0 && (
            <div className="bg-[#fcfdfc] border-b border-[#e2ebe2] px-6 sm:px-10 py-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                Tabs:
              </span>
              {tabs.map((tab, idx) => {
                const isActive = activeTabId === tab.id;
                const isDone = completedTabs[tab.id];

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
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
                onClick={() => setActiveTabId('__all__')}
                className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  activeTabId === '__all__'
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
            {/* Lesson Title Header (shown on first tab or in all view) */}
            {(activeTabId === '__all__' || (tabs.length > 0 && activeTabId === tabs[0]?.id) || tabs.length === 0) && (
              <div className="space-y-3 pb-6 border-b border-[#e2ebe2]">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ec] text-[#315b36] border border-[#d6ebd6] px-3.5 py-1 text-xs font-bold">
                  <span>Interactive Learning Unit</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {lessonTitle || 'Untitled Lesson'}
                </h1>
              </div>
            )}

            {/* Learning Objectives Callout (shown on first tab or in all view) */}
            {objectives.length > 0 && (activeTabId === '__all__' || (tabs.length > 0 && activeTabId === tabs[0]?.id) || tabs.length === 0) && (
              <div className="rounded-2xl bg-[#eff4ec]/70 border border-[#d6ebd6] p-5 space-y-2.5">
                <p className="text-xs font-bold text-[#315b36] uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>What You Will Master In This Lesson</span>
                </p>
                <ul className="space-y-1.5">
                  {objectives.map((obj, i) => (
                    <li key={i} className="text-xs font-medium text-slate-700 flex items-start gap-2.5">
                      <span className="text-[#315b36] font-bold text-sm leading-none mt-0.5">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Current Tab Heading if in tabbed mode (for tab 2 onwards) */}
            {tabs.length > 0 && activeTabId !== '__all__' && activeTabId !== tabs[0]?.id && (
              <div className="pb-4 border-b border-[#e2ebe2]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#315b36] bg-[#eff4ec] px-3 py-1 rounded-lg border border-[#d6ebd6]">
                  Section {currentTabIdx + 1} of {tabs.length}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {tabs[currentTabIdx]?.title}
                </h2>
              </div>
            )}

            {/* Blocks Content in Student View */}
            <div className="space-y-6">
              {displayedBlocks.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-[#e2ebe2] bg-[#fcfdfc] p-8 space-y-2">
                  <p className="text-xs font-bold text-slate-500">No blocks in this section yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Switch to another tab or return to the builder to add content.
                  </p>
                </div>
              ) : (
                displayedBlocks.map((block) => (
                  <div key={block.id}>
                    {/* HEADING BLOCK */}
                    {block.type === 'heading' && (
                      <h2
                        className={`font-black text-slate-900 ${
                          block.content.level === 1 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                        }`}
                      >
                        {block.content.text}
                      </h2>
                    )}

                    {/* TEXT BLOCK */}
                    {block.type === 'text' && (
                      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                        {block.content.text}
                      </p>
                    )}

                    {/* CALLOUT BLOCK */}
                    {block.type === 'callout' && (
                      <div className="p-4 rounded-2xl border border-emerald-200 bg-[#eff4ec]/70 text-slate-800 space-y-1">
                        <p className="text-xs font-bold text-[#315b36] uppercase tracking-wide">
                          {block.content.title || 'Note'}
                        </p>
                        <p className="text-xs leading-relaxed text-slate-700">{block.content.text}</p>
                      </div>
                    )}

                    {/* QUOTE BLOCK */}
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

                      const imageEl = (
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

                      const sideEl = (block.content.sideTitle || block.content.sideText) ? (
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
                            <div className="md:col-span-6 w-full min-w-0">{imageEl}</div>
                            <div className="md:col-span-6 w-full min-w-0">{sideEl}</div>
                          </div>
                        );
                      }
                      if (layout === 'media-right' && sideEl) {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start w-full min-w-0">
                            <div className="md:col-span-6 w-full min-w-0 order-2 md:order-1">{sideEl}</div>
                            <div className="md:col-span-6 w-full min-w-0 order-1 md:order-2">{imageEl}</div>
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
                              <video
                                controls
                                src={block.content.url}
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                        </div>
                      );

                      const sideEl = (block.content.sideTitle || block.content.sideText) ? (
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
                            <div className="md:col-span-6 w-full min-w-0">{videoEl}</div>
                            <div className="md:col-span-6 w-full min-w-0">{sideEl}</div>
                          </div>
                        );
                      }
                      if (layout === 'media-right' && sideEl) {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start w-full min-w-0">
                            <div className="md:col-span-6 w-full min-w-0 order-2 md:order-1">{sideEl}</div>
                            <div className="md:col-span-6 w-full min-w-0 order-1 md:order-2">{videoEl}</div>
                          </div>
                        );
                      }
                      return (
                        <div className={`flex w-full ${MEDIA_ALIGN_CLASSES[align]}`}>
                          <div className={`w-full ${MEDIA_WIDTH_CLASSES[width]} min-w-0`}>
                            {videoEl}
                          </div>
                        </div>
                      );
                    })()}

                    {/* AUDIO BLOCK */}
                    {block.type === 'audio' && (() => {
                      const layout = block.settings?.layout || 'stacked';
                      const width = block.settings?.width || 'full';
                      const align = block.settings?.align || 'center';

                      const audioEl = (
                        <div className="rounded-2xl border border-[#e2ebe2] bg-[#f8faf8] p-4 space-y-3 w-full min-w-0 shadow-xs">
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
                            <audio
                              controls
                              src={block.content.url}
                              className="w-full h-9 rounded-lg"
                            />
                          ) : (
                            <p className="text-xs text-slate-400 italic">No audio recorded or uploaded.</p>
                          )}
                        </div>
                      );

                      const sideEl = (block.content.sideTitle || block.content.sideText) ? (
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
                            <div className="md:col-span-6 w-full min-w-0">{audioEl}</div>
                            <div className="md:col-span-6 w-full min-w-0">{sideEl}</div>
                          </div>
                        );
                      }
                      if (layout === 'media-right' && sideEl) {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start w-full min-w-0">
                            <div className="md:col-span-6 w-full min-w-0 order-2 md:order-1">{sideEl}</div>
                            <div className="md:col-span-6 w-full min-w-0 order-1 md:order-2">{audioEl}</div>
                          </div>
                        );
                      }
                      return (
                        <div className={`flex w-full ${MEDIA_ALIGN_CLASSES[align]}`}>
                          <div className={`w-full ${MEDIA_WIDTH_CLASSES[width]} min-w-0`}>
                            {audioEl}
                          </div>
                        </div>
                      );
                    })()}

                    {/* TABBED CONTENT BOX (block.type === 'tabs') */}
                    {block.type === 'tabs' && (() => {
                      const blockTabs = block.content.tabs || [];
                      const activeSubIdx = innerTabIndices[block.id] ?? 0;
                      const activeSubTab = blockTabs[activeSubIdx] || blockTabs[0];

                      return (
                        <div className="rounded-2xl border border-[#e2ebe2] bg-white shadow-xs overflow-hidden">
                          {/* Inner Tab bar */}
                          <div className="flex items-center gap-1.5 p-2 bg-[#f8faf8] border-b border-[#e2ebe2] overflow-x-auto no-scrollbar">
                            {blockTabs.map((tab: any, tIdx: number) => {
                              const isSubActive = activeSubIdx === tIdx;
                              return (
                                <button
                                  key={tIdx}
                                  onClick={() => setInnerTabIndices((prev) => ({ ...prev, [block.id]: tIdx }))}
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
                          {/* Inner Tab Content */}
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
                            <CheckCircle2 className="h-4 w-4" />
                            Knowledge Check
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
                                onClick={() => handleSelectQuiz(block.id, optIdx)}
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
                            onClick={() => handleSubmitQuiz(block.id)}
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
                                <span className="text-rose-600">✕ Incorrect. Review the explanation below.</span>
                              )}
                            </p>
                            {block.content.explanation && (
                              <p className="text-slate-600 pt-1">
                                {block.content.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* FLASHCARDS BLOCK */}
                    {block.type === 'flashcards' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-[#315b36]">
                          <span>Flashcards (Click card to flip)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {(block.content.cards || []).map((c: any, cIdx: number) => {
                            const isFlipped = flippedCards[`${block.id}_${cIdx}`];
                            return (
                              <div
                                key={cIdx}
                                onClick={() => toggleFlip(`${block.id}_${cIdx}`)}
                                className={`cursor-pointer p-6 rounded-2xl border transition-all min-h-[140px] flex flex-col justify-between shadow-xs ${
                                  isFlipped
                                    ? 'border-emerald-300 bg-[#eff4ec]/70'
                                    : 'border-[#e2ebe2] bg-[#fcfdfc] hover:border-slate-300'
                                }`}
                              >
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {isFlipped ? 'Definition / Answer' : 'Term / Question'}
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

                    {/* AI TUTOR BLOCK */}
                    {block.type === 'aiTutor' && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                          <Bot className="h-4 w-4 text-amber-700" />
                          <span>AI Tutor Active</span>
                        </div>
                        <p className="text-xs text-slate-700 italic">
                          &quot;{block.content.starterQuestion}&quot;
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ask a question about this lesson..."
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white outline-none focus:border-amber-500"
                          />
                          <button className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold">
                            Ask
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* ── Tab Footer Controls (Leading Next/Previous Tab) ── */}
            {tabs.length > 0 && activeTabId !== '__all__' && (
              <div className="pt-8 border-t border-[#e2ebe2] flex items-center justify-between mt-12">
                {prevTab ? (
                  <button
                    onClick={() => setActiveTabId(prevTab.id)}
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
                      setCompletedTabs((prev) => ({ ...prev, [activeTabId]: true }));
                      setActiveTabId(nextTab.id);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#315b36] hover:bg-[#254629] text-white font-bold text-xs transition-all shadow-md shadow-[#315b36]/20 cursor-pointer"
                  >
                    <span>Next: {nextTab.title}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#eff4ec] text-[#315b36] font-bold text-xs border border-[#cbe6cb]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>All Tabs Completed!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
