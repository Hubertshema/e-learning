'use client';

import React, { useState } from 'react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code as CodeIcon,
  Sparkles,
  Bot,
  Layers,
  Link2,
  Eye,
  Settings as SettingsIcon,
  RotateCcw,
  Volume2,
  Edit2,
  Check,
  X,
  Minus,
  FileText,
} from 'lucide-react';
import { LessonBlock, LessonTab } from './types';
import { BLOCK_DEFINITIONS } from './block-registry';
import { AudioBlockEditor, VideoBlockEditor, ImageBlockEditor } from './media-block-editors';

interface LessonCanvasProps {
  blocks: LessonBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onUpdateBlock: (id: string, updates: Partial<LessonBlock>) => void;
  onDuplicateBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onOpenCommandPalette: (targetIndex: number) => void;
  lessonTitle: string;
  onChangeTitle: (title: string) => void;
  objectives: string[];
  onAddObjective: (obj: string) => void;
  onRemoveObjective: (index: number) => void;
  tabs?: LessonTab[];
  onUpdateTabs?: (tabs: LessonTab[]) => void;
  activeTabId?: string;
  onSelectTab?: (tabId: string) => void;
}

export function LessonCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onMoveBlock,
  onOpenCommandPalette,
  lessonTitle,
  onChangeTitle,
  objectives,
  onAddObjective,
  onRemoveObjective,
  tabs = [],
  onUpdateTabs,
  activeTabId = '__all__',
  onSelectTab,
}: LessonCanvasProps) {
  const [hoveredDividerIndex, setHoveredDividerIndex] = useState<number | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [newObjectiveText, setNewObjectiveText] = useState('');
  const [showAddObj, setShowAddObj] = useState(false);

  // Tab editing state
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState('');

  // Code runner state for interactive code blocks
  const [codeOutputs, setCodeOutputs] = useState<Record<string, string>>({});

  const handleRunCode = (blockId: string, code: string) => {
    try {
      let logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args: any[]) => logs.push('Error: ' + args.join(' ')),
      };
      const runFn = new Function('console', code);
      runFn(customConsole);
      setCodeOutputs((prev) => ({
        ...prev,
        [blockId]: logs.length > 0 ? logs.join('\n') : 'Code executed with no output.',
      }));
    } catch (err: any) {
      setCodeOutputs((prev) => ({
        ...prev,
        [blockId]: `Runtime Error: ${err.message}`,
      }));
    }
  };

  // Tab Management Handlers (Strictly icon-only UI)
  const handleAddTab = (title?: string) => {
    const newTab: LessonTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title || `Tab ${(tabs.length || 0) + 1}`,
    };
    const updated = [...tabs, newTab];
    onUpdateTabs?.(updated);
    onSelectTab?.(newTab.id);
  };

  const handleSaveRenameTab = (tabId: string) => {
    if (!editingTabTitle.trim()) {
      setEditingTabId(null);
      return;
    }
    const updated = tabs.map((t) => (t.id === tabId ? { ...t, title: editingTabTitle.trim() } : t));
    onUpdateTabs?.(updated);
    setEditingTabId(null);
  };

  const handleDeleteTab = (tabId: string) => {
    const updated = tabs.filter((t) => t.id !== tabId);
    onUpdateTabs?.(updated);
    if (activeTabId === tabId) {
      onSelectTab?.(updated[0]?.id || '__all__');
    }
  };

  // Filter blocks for active tab
  const displayedBlocks = React.useMemo(() => {
    if (!tabs || tabs.length === 0 || !activeTabId || activeTabId === '__all__') {
      return blocks;
    }
    const isFirstTab = tabs[0]?.id === activeTabId;
    return blocks.filter((b) => {
      if (b.tabId === activeTabId) return true;
      if (!b.tabId && isFirstTab) return true;
      return false;
    });
  }, [blocks, tabs, activeTabId]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#edf0f5] dark:bg-slate-950 p-4 sm:p-8 flex flex-col items-center min-w-0">
      {/* ── Realistic Microsoft Word Document Page Sheet ── */}
      <div className="w-full max-w-[850px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)] rounded-sm min-h-[1100px] px-8 sm:px-14 md:px-16 py-10 sm:py-14 space-y-6 relative transition-all min-w-0 flex flex-col">
        
        {/* ── Document Section Tabs Strip (Sleek Page Index Bar) ── */}
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* All Content Tab */}
            <button
              type="button"
              onClick={() => onSelectTab?.('__all__')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTabId === '__all__' || !activeTabId
                  ? 'bg-[#315b36] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Content ({blocks.length})
            </button>

            {tabs.map((tab, idx) => {
              const isActive = activeTabId === tab.id;
              const isEditing = editingTabId === tab.id;
              const count = blocks.filter(b => b.tabId === tab.id || (!b.tabId && idx === 0)).length;

              if (isEditing) {
                return (
                  <div key={tab.id} className="flex items-center gap-1 bg-white dark:bg-slate-800 border-2 border-[#315b36] rounded-lg px-2 py-0.5 shrink-0">
                    <input
                      type="text"
                      value={editingTabTitle}
                      onChange={(e) => setEditingTabTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRenameTab(tab.id);
                        if (e.key === 'Escape') setEditingTabId(null);
                      }}
                      className="text-xs font-bold text-slate-900 dark:text-white outline-none w-24 bg-transparent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRenameTab(tab.id)}
                      className="p-1 text-[#315b36] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded cursor-pointer"
                      title="Save"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={tab.id}
                  className={`group/tab flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#315b36] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span onClick={() => onSelectTab?.(tab.id)} className="flex items-center gap-1.5">
                    <span>{tab.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </span>

                  {/* Strictly Icon-Only Tab Actions */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTabId(tab.id);
                      setEditingTabTitle(tab.title);
                    }}
                    title="Rename Tab"
                    className={`opacity-0 group-hover/tab:opacity-100 p-0.5 rounded cursor-pointer ${
                      isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTab(tab.id)}
                    title="Delete Tab"
                    className={`opacity-0 group-hover/tab:opacity-100 p-0.5 rounded cursor-pointer ${
                      isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-500'
                    }`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            {/* Quick Add Tab (+) Button - STRICTLY ICON ONLY */}
            <button
              type="button"
              onClick={() => handleAddTab()}
              title="Add New Section Tab"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-slate-300 hover:border-[#315b36] text-slate-500 hover:text-[#315b36] hover:bg-[#eff4ec] transition-all cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Document Title (Typed Directly on Paper, Word Style) ── */}
        <div className="pt-2">
          <input
            type="text"
            value={lessonTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Type lesson title here..."
            className="w-full text-3xl sm:text-4xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 outline-none bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-lg px-1 py-1 transition-colors tracking-tight"
          />
        </div>

        {/* ── Learning Objectives (Styled as Clean Document Callout Box) ── */}
        <div className="rounded-xl bg-[#f8faf8] dark:bg-emerald-950/20 border-l-4 border-[#315b36] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#315b36] dark:text-emerald-400">
              <span>🎯</span>
              <span>Learning Objectives & Can-Do Descriptors</span>
            </div>
            <button
              onClick={() => setShowAddObj(!showAddObj)}
              className="text-[11px] font-bold text-[#315b36] hover:underline cursor-pointer"
            >
              + Add Objective
            </button>
          </div>

          {objectives.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No objectives defined yet. Click &quot;+ Add Objective&quot; to guide students on what they will master.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {objectives.map((obj, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 text-xs text-slate-700 dark:text-slate-300 group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[#315b36] font-bold mt-0.5">•</span>
                    <span>{obj}</span>
                  </div>
                  <button
                    onClick={() => onRemoveObjective(i)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 text-[10px] cursor-pointer"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showAddObj && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="e.g. Can analyze airport vocabulary and idioms..."
                value={newObjectiveText}
                onChange={(e) => setNewObjectiveText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newObjectiveText.trim()) {
                    onAddObjective(newObjectiveText.trim());
                    setNewObjectiveText('');
                    setShowAddObj(false);
                  }
                }}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  if (newObjectiveText.trim()) {
                    onAddObjective(newObjectiveText.trim());
                    setNewObjectiveText('');
                    setShowAddObj(false);
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#315b36] text-white hover:bg-[#254629] cursor-pointer"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* ── Empty Page State ── */}
        {blocks.length === 0 && (
          <div className="py-24 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36]">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Start typing or add document content
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Insert text paragraphs, images, videos, audio clips, quizzes, or interactive flashcards.
              </p>
            </div>
            <button
              onClick={() => onOpenCommandPalette(0)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#315b36] hover:bg-[#254629] rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Insert First Element</span>
            </button>
          </div>
        )}

        {/* ── Document Content Flow (No Rigid Blocks Look, Natural Page Elements) ── */}
        <div className="space-y-4 flex-1">
          {displayedBlocks.map((block) => {
            const actualGlobalIndex = blocks.findIndex((b) => b.id === block.id);
            const isSelected = selectedBlockId === block.id;

            return (
              <React.Fragment key={block.id}>
                {/* Thin Hover Insertion Line Between Document Elements */}
                <div
                  onMouseEnter={() => setHoveredDividerIndex(actualGlobalIndex)}
                  onMouseLeave={() => setHoveredDividerIndex(null)}
                  className="relative h-2 flex items-center justify-center group cursor-pointer"
                  onClick={() => onOpenCommandPalette(actualGlobalIndex)}
                >
                  <div
                    className={`w-full transition-all ${
                      hoveredDividerIndex === actualGlobalIndex
                        ? 'h-0.5 bg-[#315b36]'
                        : 'h-px bg-transparent'
                    }`}
                  />
                  {hoveredDividerIndex === actualGlobalIndex && (
                    <div className="absolute z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#315b36] text-white text-[10px] font-bold shadow-sm animate-in zoom-in-75 duration-100">
                      <Plus className="h-3 w-3" />
                      <span>Insert here</span>
                    </div>
                  )}
                </div>

                {/* Natural Document Element Wrapper (No labels, no rigid cards at rest) */}
                <div
                  onMouseEnter={() => setHoveredBlockId(block.id)}
                  onMouseLeave={() => setHoveredBlockId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBlock(block.id);
                  }}
                  className={`group relative rounded-xl transition-all duration-150 p-1.5 sm:p-2.5 ${
                    isSelected
                      ? 'ring-1.5 ring-[#315b36]/40 bg-[#fbfdfb]/60 dark:bg-slate-800/40 shadow-2xs'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/20'
                  }`}
                >
                  {/* Left Gutter: Drag Handle & Quick Insert (+) Button (Notion/Word Style) */}
                  <div className="absolute -left-9 sm:-left-10 top-2.5 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCommandPalette(actualGlobalIndex);
                      }}
                      title="Insert element here"
                      className="p-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer text-[#315b36]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <div title="Drag to reorder" className="p-1 cursor-grab">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* Floating Action Bar (Shown ONLY on Hover or Selection, Top-Right) */}
                  {(isSelected || hoveredBlockId === block.id) && (
                    <div className="absolute -top-3.5 right-2 z-20 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 shadow-md text-slate-500 animate-in fade-in duration-100">
                      <span className="text-[10px] font-bold text-[#315b36] uppercase tracking-wider">
                        {BLOCK_DEFINITIONS.find((d) => d.id === block.type)?.name || block.type}
                      </span>
                      <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveBlock(block.id, 'up');
                        }}
                        disabled={actualGlobalIndex === 0}
                        title="Move Up"
                        className="p-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveBlock(block.id, 'down');
                        }}
                        disabled={actualGlobalIndex === blocks.length - 1}
                        title="Move Down"
                        className="p-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateBlock(block.id);
                        }}
                        title="Duplicate"
                        className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBlock(block.id);
                        }}
                        title="Delete"
                        className="p-1 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      {/* Tab Reassignment Select (If tabs exist) */}
                      {tabs && tabs.length > 0 && (
                        <>
                          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                          <select
                            value={block.tabId || ''}
                            onChange={(e) => onUpdateBlock(block.id, { tabId: e.target.value || undefined })}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none text-[#315b36] font-bold cursor-pointer hover:border-slate-300"
                            title="Assign to Section Tab"
                          >
                            <option value="">Tab 1</option>
                            {tabs.map((t, idx) => (
                              <option key={t.id} value={t.id}>
                                Tab {idx + 1}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  )}

                  {/* Document Element Body */}
                  <div className="w-full">
                    <BlockRenderer
                      block={block}
                      onUpdate={(contentUpdates) =>
                        onUpdateBlock(block.id, {
                          content: { ...block.content, ...contentUpdates },
                        })
                      }
                      onUpdateSettings={(settingsUpdates) =>
                        onUpdateBlock(block.id, {
                          settings: { ...block.settings, ...settingsUpdates },
                        })
                      }
                      codeOutput={codeOutputs[block.id]}
                      onRunCode={(code) => handleRunCode(block.id, code)}
                    />
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* Bottom Insertion Prompt */}
          {blocks.length > 0 && (
            <div className="pt-6 pb-4 text-center">
              <button
                onClick={() => onOpenCommandPalette(blocks.length)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:border-[#315b36] hover:text-[#315b36] hover:bg-[#eff4ec]/50 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Insert Next Element</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Document Page Footer (Word Style) ── */}
        <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 mt-auto">
          <span>LinguaChris LMS • Course Studio</span>
          <span>Document Page</span>
        </div>
      </div>
    </div>
  );
}

// ── Document Element Renderers (Styled Naturally Like Word/Docs) ─────────

function BlockRenderer({
  block,
  onUpdate,
  onUpdateSettings = () => {},
  codeOutput,
  onRunCode,
}: {
  block: LessonBlock;
  onUpdate: (updates: Record<string, any>) => void;
  onUpdateSettings?: (updates: Record<string, any>) => void;
  codeOutput?: string;
  onRunCode: (code: string) => void;
}) {
  switch (block.type) {
    case 'heading': {
      const level = block.content.level || 2;
      return (
        <input
          type="text"
          value={block.content.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Heading title..."
          className={`w-full font-black text-slate-900 dark:text-white bg-transparent outline-none placeholder-slate-300 ${
            level === 1 ? 'text-2xl sm:text-3xl' : level === 2 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
          }`}
        />
      );
    }

    case 'text':
      return (
        <textarea
          rows={3}
          value={block.content.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Start typing paragraph text..."
          className="w-full text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent outline-none resize-none placeholder-slate-300"
        />
      );

    case 'callout': {
      const variant = block.content.variant || 'info';
      const colors = {
        info: 'bg-blue-50/70 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300',
        tip: 'bg-[#eff4ec] border-[#d6ebd6] text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300',
        warning: 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300',
        success: 'bg-teal-50/70 border-teal-200 text-teal-900 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-300',
      }[variant as 'info' | 'tip' | 'warning' | 'success'] || 'bg-slate-50 border-slate-200 text-slate-900';

      return (
        <div className={`p-4 rounded-xl border ${colors} space-y-1.5`}>
          <input
            type="text"
            value={block.content.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Callout Title..."
            className="w-full font-bold text-xs bg-transparent outline-none uppercase tracking-wide"
          />
          <textarea
            rows={2}
            value={block.content.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Enter callout note or tip..."
            className="w-full text-xs bg-transparent outline-none resize-none leading-relaxed"
          />
        </div>
      );
    }

    case 'quote':
      return (
        <div className="border-l-4 border-[#315b36] pl-4 py-2 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/20 rounded-r-xl">
          <textarea
            rows={2}
            value={block.content.quote || ''}
            onChange={(e) => onUpdate({ quote: e.target.value })}
            placeholder="Quote text..."
            className="w-full italic text-sm text-slate-700 dark:text-slate-300 bg-transparent outline-none resize-none"
          />
          <input
            type="text"
            value={block.content.author || ''}
            onChange={(e) => onUpdate({ author: e.target.value })}
            placeholder="— Author or Reference"
            className="w-full text-xs font-semibold text-slate-500 bg-transparent outline-none"
          />
        </div>
      );

    case 'image':
      return (
        <ImageBlockEditor
          content={block.content}
          settings={block.settings}
          onUpdate={onUpdate}
          onUpdateSettings={onUpdateSettings}
        />
      );

    case 'video':
      return (
        <VideoBlockEditor
          content={block.content}
          settings={block.settings}
          onUpdate={onUpdate}
          onUpdateSettings={onUpdateSettings}
        />
      );

    case 'audio':
      return (
        <AudioBlockEditor
          content={block.content}
          settings={block.settings}
          onUpdate={onUpdate}
          onUpdateSettings={onUpdateSettings}
        />
      );

    case 'tabs': {
      const innerTabs = block.content.tabs || [
        { title: 'Overview', content: 'Key explanation or rule presentation.' },
        { title: 'Examples', content: 'Practical conversation or sentence examples.' },
      ];
      const activeSub = block.content.activeTab ?? 0;

      const handleAddSubTab = () => {
        const newTabs = [...innerTabs, { title: `Tab ${innerTabs.length + 1}`, content: '' }];
        onUpdate({ tabs: newTabs, activeTab: newTabs.length - 1 });
      };

      const handleUpdateSubTab = (idx: number, updates: Partial<{ title: string; content: string }>) => {
        const next = [...innerTabs];
        next[idx] = { ...next[idx], ...updates };
        onUpdate({ tabs: next });
      };

      const handleRemoveSubTab = (idx: number) => {
        if (innerTabs.length <= 1) return;
        const next = innerTabs.filter((_: any, i: number) => i !== idx);
        onUpdate({
          tabs: next,
          activeTab: Math.max(0, activeSub >= next.length ? next.length - 1 : activeSub),
        });
      };

      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#315b36] flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> Tabbed Content Box
            </span>
            <button
              type="button"
              onClick={handleAddSubTab}
              className="text-xs font-bold text-[#315b36] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Sub-Tab
            </button>
          </div>

          {/* Sub-Tabs Header */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto no-scrollbar">
            {innerTabs.map((t: any, i: number) => {
              const isActive = activeSub === i;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#315b36] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onUpdate({ activeTab: i })}
                    className="outline-none cursor-pointer"
                  >
                    {t.title || `Tab ${i + 1}`}
                  </button>
                  {innerTabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSubTab(i);
                      }}
                      className={`text-[10px] ml-1 p-0.5 rounded cursor-pointer ${
                        isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-500'
                      }`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Sub-Tab Editor */}
          {innerTabs[activeSub] && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Tab Title
                </label>
                <input
                  type="text"
                  value={innerTabs[activeSub].title}
                  onChange={(e) => handleUpdateSubTab(activeSub, { title: e.target.value })}
                  placeholder="e.g. Overview, Dialogue, Conjugation..."
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:border-[#315b36]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Tab Content
                </label>
                <textarea
                  rows={4}
                  value={innerTabs[activeSub].content}
                  onChange={(e) => handleUpdateSubTab(activeSub, { content: e.target.value })}
                  placeholder="Enter explanation, examples, or notes for this tab..."
                  className="w-full text-xs leading-relaxed p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:border-[#315b36] resize-none"
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    case 'quiz': {
      const options: string[] = block.content.options || [];
      const correctIndex = block.content.correctAnswer ?? 0;

      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#315b36] dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Interactive Quiz Question
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#eef5ee] text-[#315b36]">
              {block.content.points || 10} Points
            </span>
          </div>

          <textarea
            rows={2}
            value={block.content.question || ''}
            onChange={(e) => onUpdate({ question: e.target.value })}
            placeholder="Type your question prompt here..."
            className="w-full text-sm font-bold text-slate-900 dark:text-white bg-transparent outline-none resize-none"
          />

          <div className="space-y-2">
            {options.map((opt, i) => {
              const isCorrect = correctIndex === i;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onUpdate({ correctAnswer: i })}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                      isCorrect
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                    title={isCorrect ? 'Correct Answer' : 'Click to set as correct answer'}
                  >
                    {isCorrect && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>

                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[i] = e.target.value;
                      onUpdate({ options: newOptions });
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 text-xs bg-transparent outline-none text-slate-800 dark:text-slate-200"
                  />

                  {options.length > 2 && (
                    <button
                      onClick={() => {
                        const newOptions = options.filter((_, idx) => idx !== i);
                        onUpdate({
                          options: newOptions,
                          correctAnswer: correctIndex >= newOptions.length ? 0 : correctIndex,
                        });
                      }}
                      className="text-slate-400 hover:text-rose-500 text-xs px-1 cursor-pointer"
                      title="Remove option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onUpdate({ options: [...options, `New Option ${options.length + 1}`] })}
            className="text-xs font-bold text-[#315b36] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Answer Option</span>
          </button>
        </div>
      );
    }

    case 'flashcards': {
      const cards: Array<{ id: string; front: string; back: string }> = block.content.cards || [];

      const addCard = () => {
        const newCard = { id: String(Date.now()), front: '', back: '' };
        onUpdate({ cards: [...cards, newCard] });
      };

      const updateCard = (index: number, field: 'front' | 'back', val: string) => {
        const next = [...cards];
        next[index] = { ...next[index], [field]: val };
        onUpdate({ cards: next });
      };

      const removeCard = (index: number) => {
        const next = cards.filter((_, i) => i !== index);
        onUpdate({ cards: next });
      };

      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#315b36]" /> Flashcard Deck ({cards.length} cards)
            </span>
            <button
              type="button"
              onClick={addCard}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#315b36] hover:underline cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Card
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cards.map((c, i) => (
              <div
                key={c.id || i}
                className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Card #{i + 1} • Front (Term)
                  </span>
                  {cards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCard(i)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors text-xs cursor-pointer"
                      title="Delete card"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={c.front}
                  onChange={(e) => updateCard(i, 'front', e.target.value)}
                  placeholder="Front: Concept, word, or prompt..."
                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#315b36]"
                />

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-0.5">
                  Back (Definition or Translation)
                </span>
                <textarea
                  rows={2}
                  value={c.back}
                  onChange={(e) => updateCard(i, 'back', e.target.value)}
                  placeholder="Back: Meaning, definition, or answer..."
                  className="w-full text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#315b36] resize-none"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCard}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:border-[#315b36] hover:text-[#315b36] hover:bg-[#eef5ee]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Another Card</span>
          </button>
        </div>
      );
    }

    case 'code':
      return (
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#1e1e1e] text-slate-100 shadow-md">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CodeIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-slate-300">
                {block.content.language || 'javascript'}
              </span>
            </div>
            <button
              onClick={() => onRunCode(block.content.starterCode || '')}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Run Code</span>
            </button>
          </div>

          <textarea
            rows={6}
            value={block.content.starterCode || ''}
            onChange={(e) => onUpdate({ starterCode: e.target.value })}
            className="w-full p-4 font-mono text-xs bg-transparent outline-none text-emerald-300 resize-none leading-relaxed"
          />

          {codeOutput && (
            <div className="p-3 bg-[#181818] border-t border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Terminal Output</span>
              <pre className="whitespace-pre-wrap">{codeOutput}</pre>
            </div>
          )}
        </div>
      );

    case 'aiTutor':
      return (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Bot className="h-4 w-4 text-amber-600" />
              <span>{block.content.tutorName || 'AI Socratic Tutor'}</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900 text-amber-800 dark:text-amber-200 uppercase">
              {block.content.responseStyle || 'socratic'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 italic">
            &quot;{block.content.starterQuestion}&quot;
          </p>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-800/60 text-[11px] text-slate-400">
            Students can ask real-time questions here. Tutor is constrained to this lesson&apos;s curriculum.
          </div>
        </div>
      );

    case 'aiPractice':
      return (
        <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 text-xs font-bold">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>AI Dynamic Practice Generator</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/60 text-purple-800 uppercase">
              {block.content.difficulty || 'medium'}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
            Topic: {block.content.topic}
          </p>
          <p className="text-[11px] text-slate-500">
            Auto-generates {block.content.questionCount || 3} questions on demand for each student.
          </p>
        </div>
      );

    case 'divider':
      return <hr className="my-2 border-t border-slate-200 dark:border-slate-800" />;

    case 'button':
      return (
        <div className="flex justify-start">
          <button className="px-5 py-2.5 rounded-xl bg-[#315b36] text-white font-bold text-xs shadow-md">
            {block.content.label || 'Action Button'}
          </button>
        </div>
      );

    default:
      return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          Block: {block.type}
        </div>
      );
  }
}
