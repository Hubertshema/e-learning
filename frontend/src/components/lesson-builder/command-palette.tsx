'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, Layers, Plus } from 'lucide-react';
import { BLOCK_DEFINITIONS, CATEGORY_LABELS } from './block-registry';
import { BlockType, BlockCategory } from './types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (type: BlockType) => void;
  targetIndex?: number | null;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectBlock,
  targetIndex,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('ALL');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: (BlockCategory | 'ALL')[] = ['ALL', 'CONTENT', 'INTERACTIVE', 'LEARNING', 'AI'];

  const filteredBlocks = BLOCK_DEFINITIONS.filter((b) => {
    const matchesCat = activeCategory === 'ALL' || b.category === activeCategory;
    const matchesQuery =
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.description.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="relative flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search blocks (Text, Quiz, Video, Code, AI Tutor...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 outline-none dark:text-white"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="ml-2 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Esc to exit
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            const label = cat === 'ALL' ? 'All Blocks' : CATEGORY_LABELS[cat]?.label || cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#315b36] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Block Grid / List */}
        <div className="max-h-[380px] overflow-y-auto p-3 space-y-1">
          {filteredBlocks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No blocks found matching &quot;{query}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredBlocks.map((block) => {
                const Icon = block.icon;
                const catMeta = CATEGORY_LABELS[block.category];
                return (
                  <button
                    key={block.id}
                    onClick={() => {
                      onSelectBlock(block.id);
                      onClose();
                    }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-300/70 hover:bg-[#f0f8f0]/40 dark:border-slate-800/80 dark:hover:border-emerald-700/60 dark:hover:bg-emerald-950/20 text-left transition-all group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-[#315b36] group-hover:text-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-[#315b36] transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#315b36] dark:group-hover:text-emerald-400">
                          {block.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${catMeta?.badge}`}
                        >
                          {catMeta?.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                        {block.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 text-[11px] text-slate-500">
          <span>
            {targetIndex !== null && targetIndex !== undefined
              ? `Inserting at position ${targetIndex + 1}`
              : 'Adding to bottom of lesson'}
          </span>
          <span className="font-medium">Click any block to insert</span>
        </div>
      </div>
    </div>
  );
}
