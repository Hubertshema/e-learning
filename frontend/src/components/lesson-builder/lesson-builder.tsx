'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Undo2,
  Redo2,
  Check,
  Sparkles,
  Layers,
  Settings as SettingsIcon,
  ListTree,
  Sliders,
  PanelLeft,
  PanelRight,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { LessonBlock, LessonSettingsData, BlockType } from './types';
import { BLOCK_DEFINITIONS, createNewBlock } from './block-registry';
import { BlockLibraryPanel } from './block-library-panel';
import { PropertiesPanel } from './properties-panel';
import { LessonCanvas } from './lesson-canvas';
import { CommandPalette } from './command-palette';
import { StudentPreview } from './student-preview';
import { OutlineTab } from './outline-tab';
import { SettingsTab } from './settings-tab';
import { apiClient } from '@/lib/api-client';
import {
  getSocketClient,
  joinLessonRoom,
  leaveLessonRoom,
  broadcastLessonUpdate,
  saveLiveLessonViaSocket,
} from '@/lib/socket-client';
import { uploadAllPendingBlocks } from '@/lib/pending-media';

interface LessonBuilderProps {
  courseId: string;
  lessonId?: string;
  initialUnitId?: string;
  mode?: 'create' | 'edit';
  backHref?: string;
}

export function LessonBuilder({
  courseId,
  lessonId,
  initialUnitId,
  mode = 'create',
  backHref,
}: LessonBuilderProps) {
  const router = useRouter();

  // Active workspace tab: 'content' | 'outline' | 'settings'
  const [activeTab, setActiveTab] = useState<'content' | 'outline' | 'settings'>('content');

  // Preview Mode
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Panels toggle for responsive / customizable layout
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Selected Block
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteTargetIndex, setPaletteTargetIndex] = useState<number | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Main Lesson State (Starts 100% blank for teacher authoring) ──
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);

  const [settings, setSettings] = useState<LessonSettingsData>({
    title: '',
    description: '',
    unitId: initialUnitId || '',
    courseId,
    levelId: 'A1',
    estimatedDuration: 30,
    status: 'draft',
    isFreePreview: false,
    objectives: [],
    prerequisites: [],
    completionRule: 'all_blocks',
    accessScope: 'course',
    tabs: [],
  });

  // Active Canvas Tab for filtering and block creation
  const [activeCanvasTabId, setActiveCanvasTabId] = useState<string>('__all__');

  // History Stack for Undo/Redo
  const [history, setHistory] = useState<Array<{ blocks: LessonBlock[]; title: string }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Autosave Status
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('just now');
  const isInitialLoad = useRef(true);

  // Load existing lesson data if editing
  useEffect(() => {
    if (mode === 'edit' && lessonId) {
      apiClient
        .get<any>(`/teacher/lessons/${lessonId}`)
        .then((res: any) => {
          const lData = res?.data || res;
          if (lData) {
            setSettings((prev) => ({
              ...prev,
              title: lData.title || prev.title,
              description: lData.description || prev.description,
              estimatedDuration: lData.estimatedMinutes || prev.estimatedDuration,
              isFreePreview: Boolean(lData.isFreePreview),
              status: lData.isPublished ? 'published' : 'draft',
              unitId: lData.unitId || prev.unitId,
            }));

            // Check if serialized blocks exist in sections
            if (lData.sections && lData.sections.length > 0) {
              const secContent = lData.sections[0].content;
              if (secContent && typeof secContent === 'string' && secContent.startsWith('{')) {
                try {
                  const parsed = JSON.parse(secContent);
                  if (Array.isArray(parsed.blocks)) {
                    setBlocks(parsed.blocks);
                  }
                  if (Array.isArray(parsed.tabs)) {
                    setSettings((prev) => ({ ...prev, tabs: parsed.tabs }));
                  }
                } catch {
                  // Fallback: create text block with content
                  setBlocks([
                    createNewBlock('heading', 0),
                    {
                      ...createNewBlock('text', 1),
                      content: { text: secContent.replace(/<[^>]+>/g, ' ') },
                    },
                  ]);
                }
              }
            }
          }
        })
        .catch(() => {
          showToast('error', 'Failed to load lesson from server. Using editor defaults.');
        });
    }
  }, [mode, lessonId]);

  // Real-time Socket.IO room synchronization
  useEffect(() => {
    if (!lessonId) return;
    joinLessonRoom(lessonId);

    const socket = getSocketClient();
    if (socket?.on) {
      socket.on('lesson_live_updated', (data: any) => {
        if (data?.lessonId === lessonId && Array.isArray(data.blocks)) {
          setBlocks(data.blocks);
          if (data.settings?.title) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
        }
      });
    }

    return () => {
      leaveLessonRoom(lessonId);
      if (socket?.off) {
        socket.off('lesson_live_updated');
      }
    };
  }, [lessonId]);

  // Record history
  const pushHistory = useCallback(
    (newBlocks: LessonBlock[], newTitle: string) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, { blocks: newBlocks, title: newTitle }];
      });
      setHistoryIndex((prev) => prev + 1);
      setSavingStatus('dirty');
    },
    [historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setBlocks(target.blocks);
      setSettings((prev) => ({ ...prev, title: target.title }));
      setHistoryIndex((prev) => prev - 1);
      setSavingStatus('dirty');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setBlocks(target.blocks);
      setSettings((prev) => ({ ...prev, title: target.title }));
      setHistoryIndex((prev) => prev + 1);
      setSavingStatus('dirty');
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Ctrl + S: Save
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave(false);
      }
      // Ctrl + P: Preview
      else if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPreviewOpen((prev) => !prev);
      }
      // Ctrl + K: Command Palette
      else if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteTargetIndex(null);
        setIsCommandPaletteOpen(true);
      }
      // Ctrl + Z: Undo
      else if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl + Shift + Z: Redo
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleRedo();
      }
      // Delete selected block
      else if (e.key === 'Delete' && selectedBlockId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          handleDeleteBlock(selectedBlockId);
        }
      }
      // Ctrl + D: Duplicate
      else if (isCmdOrCtrl && e.key.toLowerCase() === 'd' && selectedBlockId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleDuplicateBlock(selectedBlockId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Debounced Autosave
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      if (savingStatus === 'dirty') {
        setSavingStatus('saving');
        try {
          const preparedBlocks = await uploadAllPendingBlocks(blocks);
          setBlocks(preparedBlocks);
          if (lessonId) {
            saveLiveLessonViaSocket({
              lessonId,
              blocks: preparedBlocks,
              settings,
              title: settings.title.trim(),
            });
          }
          setSavingStatus('saved');
          setLastSavedTime('just now');
        } catch (err) {
          console.warn('Autosave warning:', err);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [blocks, settings, savingStatus, lessonId]);

  // ── Block Mutations ───────────────────────────────────────────────
  const handleAddBlock = (type: BlockType, targetIndex?: number | null) => {
    const insertIdx =
      targetIndex !== undefined && targetIndex !== null ? targetIndex : blocks.length;
    const newBlock = createNewBlock(type, insertIdx);
    if (activeCanvasTabId && activeCanvasTabId !== '__all__') {
      newBlock.tabId = activeCanvasTabId;
    }

    const nextBlocks = [...blocks];
    nextBlocks.splice(insertIdx, 0, newBlock);
    const reordered = nextBlocks.map((b, i) => ({ ...b, order: i }));

    setBlocks(reordered);
    setSelectedBlockId(newBlock.id);
    pushHistory(reordered, settings.title);
    showToast('success', `Added ${type} block.`);
  };

  const handleUpdateBlock = (id: string, updates: Partial<LessonBlock>) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      if (lessonId) {
        broadcastLessonUpdate({
          lessonId,
          blocks: updated,
          settings,
          updatedBlockId: id,
        });
      }
      return updated;
    });
    setSavingStatus('dirty');
  };

  const handleDuplicateBlock = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const original = blocks[idx];
    const duplicated: LessonBlock = {
      ...original,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      order: idx + 1,
      content: JSON.parse(JSON.stringify(original.content)),
      settings: JSON.parse(JSON.stringify(original.settings)),
    };

    const nextBlocks = [...blocks];
    nextBlocks.splice(idx + 1, 0, duplicated);
    const reordered = nextBlocks.map((b, i) => ({ ...b, order: i }));

    setBlocks(reordered);
    setSelectedBlockId(duplicated.id);
    pushHistory(reordered, settings.title);
    showToast('success', 'Block duplicated.');
  };

  const handleDeleteBlock = (id: string) => {
    const nextBlocks = blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i }));
    setBlocks(nextBlocks);
    if (selectedBlockId === id) setSelectedBlockId(null);
    pushHistory(nextBlocks, settings.title);
    showToast('success', 'Block deleted.');
  };

  const handleMoveBlock = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === blocks.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const nextBlocks = [...blocks];
    const temp = nextBlocks[idx];
    nextBlocks[idx] = nextBlocks[swapIdx];
    nextBlocks[swapIdx] = temp;

    const reordered = nextBlocks.map((b, i) => ({ ...b, order: i }));
    setBlocks(reordered);
    pushHistory(reordered, settings.title);
  };

  // ── Save & Publish Handlers ───────────────────────────────────────
  const handleSave = async (publish: boolean = false) => {
    if (!settings.title.trim()) {
      showToast('error', 'Please enter a lesson title.');
      return;
    }

    try {
      setSavingStatus('saving');

      // 1. Automatically upload any pending media (images, audio recordings, video files) to Cloudinary
      const preparedBlocks = await uploadAllPendingBlocks(blocks);
      setBlocks(preparedBlocks);

      // Generate HTML/Text summary representation
      const textSummary = preparedBlocks
        .map((b) => {
          if (b.type === 'heading') return `<h2>${b.content.text || ''}</h2>`;
          if (b.type === 'text') return `<p>${b.content.text || ''}</p>`;
          if (b.type === 'quiz') return `<p><strong>Quiz:</strong> ${b.content.question || ''}</p>`;
          return `<p>[${b.type}]</p>`;
        })
        .join('\n');

      // Extract primary media URL from blocks (video, audio, or image) to store in mediaUrl column
      const mediaBlock = preparedBlocks.find((b) => ['video', 'audio', 'image'].includes(b.type) && b.content?.url);
      const primaryMediaUrl = mediaBlock?.content?.url || null;

      const payload = {
        title: settings.title.trim(),
        description: settings.description || textSummary.slice(0, 200).replace(/<[^>]+>/g, ''),
        estimatedMinutes: settings.estimatedDuration || 30,
        isFreePreview: settings.isFreePreview,
        isPublished: publish || settings.status === 'published',
        sections: [
          {
            title: settings.title.trim(),
            contentType: 'JSON',
            content: JSON.stringify({
              blocks: preparedBlocks,
              objectives: settings.objectives,
              completionRule: settings.completionRule,
              tabs: settings.tabs || [],
            }),
            mediaUrl: primaryMediaUrl,
            orderIndex: 1,
          },
        ],
      };

      let effectiveUnitId = settings.unitId;
      if (!effectiveUnitId && mode !== 'edit') {
        try {
          const courseRes: any = await apiClient.get(`/teacher/courses/${courseId}`);
          const cData = courseRes?.data || courseRes;
          const units = cData?.units || [];
          if (units.length > 0) {
            effectiveUnitId = units[0].id;
          } else {
            const unitRes: any = await apiClient.post(`/teacher/courses/${courseId}/units`, {
              title: 'Unit 1: Fundamentals',
              orderIndex: 1,
            });
            const uData = unitRes?.data || unitRes;
            effectiveUnitId = uData?.id;
          }
          if (effectiveUnitId) {
            setSettings((prev) => ({ ...prev, unitId: effectiveUnitId }));
          }
        } catch (err: any) {
          console.warn('Unit fallback resolution:', err);
        }
      }

      let savedLessonId = lessonId;
      if (mode === 'edit' && lessonId) {
        await apiClient.patch(`/teacher/lessons/${lessonId}`, payload);
      } else if (effectiveUnitId) {
        const createRes: any = await apiClient.post(
          `/teacher/courses/${courseId}/units/${effectiveUnitId}/lessons`,
          payload
        );
        const createdLesson = createRes?.data || createRes;
        if (createdLesson?.id) {
          savedLessonId = createdLesson.id;
          router.replace(`/studio/${courseId}/lessons/${createdLesson.id}/edit`);
        }
      } else {
        throw new Error('Please select or create a unit before saving this lesson.');
      }

      // Sync via Socket.IO for real-time live updates
      if (savedLessonId) {
        saveLiveLessonViaSocket({
          lessonId: savedLessonId,
          blocks: preparedBlocks,
          settings,
          title: settings.title.trim(),
        });
      }

      setSavingStatus('saved');
      setLastSavedTime('just now');
      if (publish) {
        setSettings((prev) => ({ ...prev, status: 'published' }));
        showToast('success', 'Lesson published successfully with all media!');
      } else {
        showToast('success', 'Lesson and media saved successfully!');
      }
    } catch (err: any) {
      setSavingStatus('dirty');
      showToast('error', err.message || 'Failed to save lesson.');
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100/70 dark:bg-slate-950 overflow-hidden select-none">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl animate-in slide-in-from-bottom-4 duration-200 ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-800 dark:bg-slate-900 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-white border-rose-200 text-rose-800 dark:bg-slate-900 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── 1. TOP STICKY TOOLBAR ────────────────────────────────────── */}
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 md:px-6 backdrop-blur-md">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref || `/studio/${courseId}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Studio Curriculum"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0 flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
              {settings.title || 'Untitled Lesson'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                settings.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              {settings.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Center: Undo/Redo & Panel Toggles */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Toggle Left Block Library */}
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
              showLeftPanel
                ? 'border-[#315b36] bg-[#eef5ee] text-[#315b36]'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
            }`}
            title="Toggle Block Library"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>

          {/* Toggle Right Properties */}
          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
              showRightPanel
                ? 'border-[#315b36] bg-[#eef5ee] text-[#315b36]'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
            }`}
            title="Toggle Properties Inspector"
          >
            <PanelRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: Autosave Status, Preview, Save, Publish */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Autosave Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400">
            {savingStatus === 'saving' ? (
              <span className="flex items-center gap-1 text-amber-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="h-3 w-3" />
                Saved {lastSavedTime}
              </span>
            )}
          </div>

          {/* Student Preview Button */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
            title="Preview student view (Ctrl+P)"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Save Button */}
          <button
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[#c8dfc8] bg-[#f0f8f0] text-[#315b36] hover:bg-[#e0f0e0] dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 transition-all shadow-xs"
            title="Save draft (Ctrl+S)"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>

          {/* Primary Publish Button */}
          <button
            onClick={() => handleSave(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-[#315b36] text-white hover:bg-[#254629] transition-all shadow-md shadow-emerald-900/10 active:scale-95"
            title="Publish lesson"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* ── 2. BROWSER-STYLE TAB BAR ─────────────────────────────────── */}
      <div className="flex items-center px-4 bg-slate-200/70 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 pt-2 gap-1">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'content'
              ? 'bg-white dark:bg-slate-900 text-[#315b36] dark:text-emerald-400 border-t border-x border-slate-200/90 dark:border-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Lesson Content</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            {blocks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('outline')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'outline'
              ? 'bg-white dark:bg-slate-900 text-[#315b36] dark:text-emerald-400 border-t border-x border-slate-200/90 dark:border-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50'
          }`}
        >
          <ListTree className="h-3.5 w-3.5" />
          <span>Outline</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-slate-900 text-[#315b36] dark:text-emerald-400 border-t border-x border-slate-200/90 dark:border-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50'
          }`}
        >
          <SettingsIcon className="h-3.5 w-3.5" />
          <span>Lesson Settings</span>
        </button>
      </div>

      {/* ── 3. WORKSPACE WORK AREA ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'content' && (
          <>
            {/* Left Searchable Block Library */}
            {showLeftPanel && (
              <BlockLibraryPanel
                onAddBlock={(type) => handleAddBlock(type)}
                onCloseMobile={() => setShowLeftPanel(false)}
              />
            )}

            {/* Center Notion/Canva Lesson Document Canvas */}
            <LessonCanvas
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={(id) => setSelectedBlockId(id)}
              onUpdateBlock={handleUpdateBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onMoveBlock={handleMoveBlock}
              onOpenCommandPalette={(idx) => {
                setPaletteTargetIndex(idx);
                setIsCommandPaletteOpen(true);
              }}
              lessonTitle={settings.title}
              onChangeTitle={(title) => {
                setSettings((prev) => ({ ...prev, title }));
                setSavingStatus('dirty');
              }}
              objectives={settings.objectives}
              onAddObjective={(obj) => {
                setSettings((prev) => ({
                  ...prev,
                  objectives: [...prev.objectives, obj],
                }));
                setSavingStatus('dirty');
              }}
              onRemoveObjective={(idx) => {
                setSettings((prev) => ({
                  ...prev,
                  objectives: prev.objectives.filter((_, i) => i !== idx),
                }));
                setSavingStatus('dirty');
              }}
              tabs={settings.tabs || []}
              onUpdateTabs={(tabs) => {
                setSettings((prev) => ({ ...prev, tabs }));
                setSavingStatus('dirty');
              }}
              activeTabId={activeCanvasTabId}
              onSelectTab={setActiveCanvasTabId}
            />

            {/* Right Dynamic Properties Inspector & Tabs Preview */}
            {showRightPanel && (
              <PropertiesPanel
                selectedBlock={selectedBlock}
                onUpdateBlock={handleUpdateBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onDeleteBlock={handleDeleteBlock}
                onClose={() => setShowRightPanel(false)}
                totalBlocksCount={blocks.length}
                blocks={blocks}
                tabs={settings.tabs || []}
                onUpdateTabs={(tabs) => {
                  setSettings((prev) => ({ ...prev, tabs }));
                  setSavingStatus('dirty');
                }}
                activeTabId={activeCanvasTabId}
                onSelectTab={setActiveCanvasTabId}
                onSelectBlock={(id) => setSelectedBlockId(id)}
              />
            )}
          </>
        )}

        {activeTab === 'outline' && (
          <OutlineTab
            blocks={blocks}
            onSelectBlock={(id) => {
              setSelectedBlockId(id);
              setActiveTab('content');
            }}
            onMoveBlock={handleMoveBlock}
            onDeleteBlock={handleDeleteBlock}
            onSwitchToContent={() => setActiveTab('content')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onChangeSettings={(updates) => {
              setSettings((prev) => ({ ...prev, ...updates }));
              setSavingStatus('dirty');
            }}
          />
        )}
      </div>

      {/* ── 4. COMMAND PALETTE MODAL ─────────────────────────────────── */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => {
          setIsCommandPaletteOpen(false);
          setPaletteTargetIndex(null);
        }}
        onSelectBlock={(type) => {
          handleAddBlock(type, paletteTargetIndex);
        }}
        targetIndex={paletteTargetIndex}
      />

      {/* ── 5. STUDENT PREVIEW SIMULATOR ─────────────────────────────── */}
      {isPreviewOpen && (
        <StudentPreview
          lessonTitle={settings.title}
          objectives={settings.objectives}
          blocks={blocks}
          tabs={settings.tabs || []}
          onExitPreview={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}
