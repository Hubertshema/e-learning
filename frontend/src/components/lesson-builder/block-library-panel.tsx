'use client';

import React, { useState } from 'react';
import { Search, Plus, Sparkles, Layers, ChevronDown, ChevronRight, X } from 'lucide-react';
import { BLOCK_DEFINITIONS, CATEGORY_LABELS } from './block-registry';
import { BlockCategory, BlockType } from './types';

interface BlockLibraryPanelProps {
  onAddBlock: (type: BlockType) => void;
  onDragStartBlock?: (type: BlockType) => void;
  onCloseMobile?: () => void;
}

export function BlockLibraryPanel({
  onAddBlock,
  onDragStartBlock,
  onCloseMobile,
}: BlockLibraryPanelProps) {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const categories: BlockCategory[] = ['CONTENT', 'INTERACTIVE', 'LEARNING', 'AI'];

  const filtered = BLOCK_DEFINITIONS.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-72 shrink-0 select-none">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Block Library
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Click or drag into canvas</p>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#315b36] focus:ring-1 focus:ring-[#315b36]/20 transition-all"
          />
        </div>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {search ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-slate-400 px-1">
              Search Results ({filtered.length})
            </p>
            {filtered.map((block) => (
              <BlockItem
                key={block.id}
                block={block}
                onAdd={() => onAddBlock(block.id)}
                onDragStart={() => onDragStartBlock?.(block.id)}
              />
            ))}
          </div>
        ) : (
          categories.map((cat) => {
            const catBlocks = BLOCK_DEFINITIONS.filter((b) => b.category === cat);
            const isCollapsed = collapsedCategories[cat];
            const meta = CATEGORY_LABELS[cat];

            return (
              <div key={cat} className="space-y-1.5">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center justify-between w-full px-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {isCollapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {meta.label}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {catBlocks.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="space-y-1 pt-0.5">
                    {catBlocks.map((block) => (
                      <BlockItem
                        key={block.id}
                        block={block}
                        onAdd={() => onAddBlock(block.id)}
                        onDragStart={() => onDragStartBlock?.(block.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function BlockItem({
  block,
  onAdd,
  onDragStart,
}: {
  block: any;
  onAdd: () => void;
  onDragStart?: () => void;
}) {
  const Icon = block.icon;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onAdd}
      className="group relative flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all active:scale-[0.98]"
      title={`Add ${block.name} to lesson`}
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-[#315b36] group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-[#315b36] transition-colors">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#315b36] dark:group-hover:text-emerald-400">
            {block.name}
          </p>
          <p className="text-[10px] text-slate-400 truncate leading-tight">
            {block.description}
          </p>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="opacity-0 group-hover:opacity-100 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#315b36] text-white hover:bg-[#254629] transition-all shadow-xs"
        title="Add block"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
