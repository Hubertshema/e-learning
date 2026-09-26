'use client';

import React from 'react';
import { ChevronUp, ChevronDown, Trash2, Eye, EyeOff } from 'lucide-react';
import { LessonBlock } from './types';
import { BLOCK_DEFINITIONS, CATEGORY_LABELS } from './block-registry';

interface OutlineTabProps {
  blocks: LessonBlock[];
  onSelectBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onDeleteBlock: (id: string) => void;
  onSwitchToContent: () => void;
}

export function OutlineTab({
  blocks,
  onSelectBlock,
  onMoveBlock,
  onDeleteBlock,
  onSwitchToContent,
}: OutlineTabProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Lesson Structure & Outline</h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize, audit, and reorder all {blocks.length} building blocks comprising this lesson.
          </p>
        </div>

        {blocks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500">No blocks created yet in this lesson.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map((block, index) => {
              const def = BLOCK_DEFINITIONS.find((b) => b.id === block.type);
              const Icon = def?.icon;
              const catMeta = def ? CATEGORY_LABELS[def.category] : null;

              const titleSummary =
                block.content.title ||
                block.content.text ||
                block.content.question ||
                block.content.quote ||
                def?.name ||
                block.type;

              return (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <span className="text-xs font-mono font-bold text-slate-400 w-6">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {Icon && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Icon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {def?.name}
                        </span>
                        {catMeta && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${catMeta.badge}`}>
                            {catMeta.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-md">
                        {typeof titleSummary === 'string' ? titleSummary : JSON.stringify(titleSummary)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onSelectBlock(block.id);
                        onSwitchToContent();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-[#315b36] hover:text-white dark:bg-slate-800 transition-colors"
                    >
                      Jump to Block
                    </button>
                    <button
                      onClick={() => onMoveBlock(block.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onMoveBlock(block.id, 'down')}
                      disabled={index === blocks.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBlock(block.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
