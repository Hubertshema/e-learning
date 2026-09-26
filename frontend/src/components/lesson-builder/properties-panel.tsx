'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Upload,
  Loader2,
  Volume2,
  Play,
  Plus,
  Minus,
  Edit2,
  Check,
  ChevronRight,
  FileText,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { LessonBlock, LessonTab } from './types';
import { BLOCK_DEFINITIONS, CATEGORY_LABELS } from './block-registry';
import { apiClient } from '@/lib/api-client';

interface PropertiesPanelProps {
  selectedBlock: LessonBlock | null;
  onUpdateBlock: (id: string, updates: Partial<LessonBlock>) => void;
  onDuplicateBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onClose: () => void;
  totalBlocksCount: number;
  blocks?: LessonBlock[];
  tabs?: LessonTab[];
  onUpdateTabs?: (tabs: LessonTab[]) => void;
  activeTabId?: string;
  onSelectTab?: (tabId: string) => void;
  onSelectBlock?: (id: string) => void;
}

export function PropertiesPanel({
  selectedBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onClose,
  totalBlocksCount,
  blocks = [],
  tabs = [],
  onUpdateTabs,
  activeTabId = '__all__',
  onSelectTab,
  onSelectBlock,
}: PropertiesPanelProps) {
  // Sidebar view mode: 'tabs' | 'block'
  const [sidebarMode, setSidebarMode] = useState<'tabs' | 'block'>(() => {
    return selectedBlock ? 'block' : 'tabs';
  });

  // Switch to block inspector when a block gets selected
  useEffect(() => {
    if (selectedBlock) {
      setSidebarMode('block');
    }
  }, [selectedBlock?.id]);

  // Tab editing state in sidebar
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Media upload state for block inspector
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Tab Management Actions (Only icons used in UI) ──
  const handleAddTab = () => {
    const newTab: LessonTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `Section ${(tabs.length || 0) + 1}`,
    };
    const updated = [...tabs, newTab];
    onUpdateTabs?.(updated);
    onSelectTab?.(newTab.id);
    setEditingTabId(newTab.id);
    setEditingTitle(newTab.title);
  };

  const handleRemoveTab = (tabId: string) => {
    const updated = tabs.filter((t) => t.id !== tabId);
    onUpdateTabs?.(updated);
    if (activeTabId === tabId) {
      onSelectTab?.(updated[0]?.id || '__all__');
    }
  };

  const handleSaveEditTab = (tabId: string) => {
    if (!editingTitle.trim()) {
      setEditingTabId(null);
      return;
    }
    const updated = tabs.map((t) => (t.id === tabId ? { ...t, title: editingTitle.trim() } : t));
    onUpdateTabs?.(updated);
    setEditingTabId(null);
  };

  const updateContent = (key: string, value: any) => {
    if (!selectedBlock) return;
    onUpdateBlock(selectedBlock.id, {
      content: { ...selectedBlock.content, [key]: value },
    });
  };

  const updateSettings = (key: string, value: any) => {
    if (!selectedBlock) return;
    onUpdateBlock(selectedBlock.id, {
      settings: { ...selectedBlock.settings, [key]: value },
    });
  };

  const toggleVisibility = () => {
    if (!selectedBlock) return;
    onUpdateBlock(selectedBlock.id, {
      visibility: {
        ...selectedBlock.visibility,
        enabled: !selectedBlock.visibility?.enabled,
      },
    });
  };

  const def = selectedBlock ? BLOCK_DEFINITIONS.find((b) => b.id === selectedBlock.type) : null;
  const Icon = def?.icon || Layers;
  const catMeta = def ? CATEGORY_LABELS[def.category] : null;

  return (
    <aside className="hidden lg:flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-80 shrink-0 select-none overflow-hidden font-sans">
      {/* ── Top Header with Tab / Block Segmented Control ── */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-1">
          <button
            type="button"
            onClick={() => setSidebarMode('tabs')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              sidebarMode === 'tabs'
                ? 'bg-white dark:bg-slate-700 text-[#315b36] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Tabs Preview</span>
            {tabs.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#eff4ec] text-[#315b36] font-bold">
                {tabs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedBlock) setSidebarMode('block');
            }}
            disabled={!selectedBlock}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              sidebarMode === 'block'
                ? 'bg-white dark:bg-slate-700 text-[#315b36] shadow-xs'
                : selectedBlock
                ? 'text-slate-500 hover:text-slate-800'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Inspector</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Close Sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── MODE 1: TABS PREVIEW & MANAGEMENT (Right Sidebar) ── */}
      {sidebarMode === 'tabs' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header Action Bar: Title + ONLY '+' ICON (No text) */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Lesson Tabs
              </h3>
              <p className="text-[11px] text-slate-400">Structure & content preview</p>
            </div>

            {/* ONLY '+' ICON for adding tab */}
            <button
              type="button"
              onClick={handleAddTab}
              title="Add Tab"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#315b36] hover:bg-[#254629] text-white transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Quick All Blocks Switcher */}
          <button
            type="button"
            onClick={() => onSelectTab?.('__all__')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              activeTabId === '__all__'
                ? 'border-[#315b36] bg-[#eff4ec] text-[#315b36]'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              <span>All Blocks Overview</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
              {blocks.length}
            </span>
          </button>

          {/* Empty State with ONLY '+' icon */}
          {tabs.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-dashed border-[#d6ebd6] bg-[#fcfdfc] dark:bg-slate-900 space-y-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                No tabs created yet
              </p>
              <button
                type="button"
                onClick={handleAddTab}
                title="Add Tab"
                className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-[#315b36] hover:bg-[#254629] text-white shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tabs.map((tab, idx) => {
                const isActive = activeTabId === tab.id;
                const isEditing = editingTabId === tab.id;
                const tabBlocks = blocks.filter(
                  (b) => b.tabId === tab.id || (!b.tabId && idx === 0)
                );

                return (
                  <div
                    key={tab.id}
                    onClick={() => onSelectTab?.(tab.id)}
                    className={`rounded-2xl border p-3 transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#315b36] bg-[#eff4ec]/60 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-[#e2ebe2] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {/* Tab Top Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-[#315b36] text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>

                        {isEditing ? (
                          <div
                            className="flex items-center gap-1 flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditTab(tab.id);
                                if (e.key === 'Escape') setEditingTabId(null);
                              }}
                              className="text-xs font-bold px-2 py-1 rounded-lg border border-[#315b36] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none w-full"
                              autoFocus
                            />
                            {/* Save icon (No text) */}
                            <button
                              type="button"
                              onClick={() => handleSaveEditTab(tab.id)}
                              title="Save"
                              className="p-1 rounded-md text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            {/* Cancel icon (No text) */}
                            <button
                              type="button"
                              onClick={() => setEditingTabId(null)}
                              title="Cancel"
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tab.title}
                          </span>
                        )}
                      </div>

                      {/* Action Icons: ONLY EDIT & MINUS ICONS (No text) */}
                      {!isEditing && (
                        <div
                          className="flex items-center gap-0.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* ONLY EDIT ICON */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTabId(tab.id);
                              setEditingTitle(tab.title);
                            }}
                            title="Edit"
                            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* ONLY '-' (MINUS) ICON */}
                          <button
                            type="button"
                            onClick={() => handleRemoveTab(tab.id)}
                            title="Remove"
                            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tab Blocks Live Preview */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                      {tabBlocks.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No blocks in this tab yet</p>
                      ) : (
                        tabBlocks.map((b) => {
                          const bDef = BLOCK_DEFINITIONS.find((d) => d.id === b.type);
                          const bTitle =
                            b.content.title ||
                            b.content.text?.slice(0, 30) ||
                            b.content.question?.slice(0, 30) ||
                            bDef?.name ||
                            b.type;

                          const isSelected = selectedBlock?.id === b.id;

                          return (
                            <div
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectBlock?.(b.id);
                                setSidebarMode('block');
                              }}
                              className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#315b36] text-white font-bold'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="truncate flex items-center gap-1.5">
                                <span className="text-[9px] uppercase font-bold opacity-70">
                                  [{b.type}]
                                </span>
                                <span className="truncate">{bTitle}</span>
                              </span>
                              <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: BLOCK PROPERTIES INSPECTOR (Right Sidebar) ── */}
      {sidebarMode === 'block' && selectedBlock && (
        <>
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#315b36] text-white">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {def?.name || selectedBlock.type}
                  </span>
                  {catMeta && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${catMeta.badge}`}>
                      {catMeta.label}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Block #{selectedBlock.order + 1}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onDuplicateBlock(selectedBlock.id)}
                title="Duplicate Block"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDeleteBlock(selectedBlock.id)}
                title="Delete Block"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body Controls */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Lesson Tab Assignment Dropdown */}
            {tabs && tabs.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Assigned Lesson Tab
                </label>
                <select
                  value={selectedBlock.tabId || ''}
                  onChange={(e) => onUpdateBlock(selectedBlock.id, { tabId: e.target.value || undefined })}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none text-[#315b36] font-bold cursor-pointer"
                >
                  <option value="">Default (First Tab)</option>
                  {tabs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Block Type Settings */}
            {selectedBlock.type === 'heading' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Heading Level
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => updateContent('level', lvl)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        selectedBlock.content.level === lvl
                          ? 'border-[#315b36] bg-[#eef5ee] text-[#315b36]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      H{lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedBlock.type === 'callout' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Callout Style
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['info', 'tip', 'warning', 'success'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => updateContent('variant', style)}
                      className={`py-1.5 text-xs font-bold rounded-lg border capitalize transition-all cursor-pointer ${
                        selectedBlock.content.variant === style
                          ? 'border-[#315b36] bg-[#eef5ee] text-[#315b36]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Visibility Settings */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Block Visibility
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Visible to Students
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Hide this block to keep as a teacher-only note.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    selectedBlock.visibility?.enabled !== false
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {selectedBlock.visibility?.enabled !== false ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
