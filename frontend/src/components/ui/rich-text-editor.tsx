'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  Info,
  Lightbulb,
  AlertTriangle,
  BookmarkCheck,
  RotateCcw,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Badge } from './badge';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  error?: string;
  helperText?: string;
  className?: string;
  category?: 'lesson' | 'assignment' | 'feedback' | 'general';
}

// Helper to render markdown-like formatted text with syntax highlighting and callouts
export function RichTextRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  if (!content) {
    return <p className="text-xs text-slate-400 italic">No content provided.</p>;
  }

  // Detect HTML from TinyMCE and render directly with rich educational styles
  if (typeof content === 'string' && /<[a-z][\s\S]*>/i.test(content)) {
    return (
      <div
        className={cn(
          'prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200',
          // Headings
          '[&_h1]:text-2xl [&_h1]:sm:text-3xl [&_h1]:font-black [&_h1]:text-slate-900 dark:[&_h1]:text-white [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight [&_h1]:border-b [&_h1]:border-slate-200 dark:[&_h1]:border-slate-800 [&_h1]:pb-2',
          '[&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-tight',
          '[&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:mt-5 [&_h3]:mb-2',
          '[&_h4]:text-base [&_h4]:sm:text-lg [&_h4]:font-semibold [&_h4]:text-slate-900 dark:[&_h4]:text-white [&_h4]:mt-4 [&_h4]:mb-2',
          // Paragraphs & inlines
          '[&_p]:my-3 [&_p]:leading-relaxed [&_p]:text-slate-700 dark:[&_p]:text-slate-300',
          '[&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-white',
          '[&_em]:italic',
          '[&_u]:underline [&_u]:underline-offset-2',
          '[&_s]:line-through [&_s]:text-slate-400 dark:[&_s]:text-slate-500',
          // Blockquotes (Teacher tips, callouts, warnings)
          '[&_blockquote]:my-4 [&_blockquote]:pl-4 [&_blockquote]:py-3 [&_blockquote]:pr-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-500 [&_blockquote]:bg-primary-50/50 dark:[&_blockquote]:bg-primary-950/30 [&_blockquote]:rounded-r-xl [&_blockquote]:italic [&_blockquote]:text-slate-700 dark:[&_blockquote]:text-slate-300 [&_blockquote_strong]:text-primary-900 dark:[&_blockquote_strong]:text-primary-200 [&_blockquote_strong]:not-italic',
          // Tables
          '[&_table]:w-full [&_table]:my-5 [&_table]:border-collapse [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-slate-200 dark:[&_table]:border-slate-800 [&_table]:shadow-xs',
          '[&_thead]:bg-slate-100/90 dark:[&_thead]:bg-slate-800/90',
          '[&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_th]:py-3 [&_th]:px-4 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-700 dark:[&_th]:text-slate-200',
          '[&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 [&_td]:py-3 [&_td]:px-4 [&_td]:text-xs [&_td]:sm:text-sm [&_td]:text-slate-700 dark:[&_td]:text-slate-300',
          '[&_tbody_tr:nth-child(even)]:bg-slate-50/60 dark:[&_tbody_tr:nth-child(even)]:bg-slate-800/40',
          '[&_tbody_tr:hover]:bg-primary-50/30 dark:[&_tbody_tr:hover]:bg-slate-800/60 [&_tbody_tr]:transition-colors',
          // Lists
          '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-1.5 [&_ul]:marker:text-primary-500',
          '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-1.5 [&_ol]:marker:text-primary-600 [&_ol]:marker:font-semibold',
          '[&_li]:leading-relaxed [&_li]:text-slate-700 dark:[&_li]:text-slate-300',
          // Code
          '[&_code]:font-mono [&_code]:text-xs [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:text-pink-600 dark:[&_code]:text-pink-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-slate-200 dark:[&_code]:border-slate-700',
          '[&_pre]:my-4 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto',
          // Horizontal Rule & Images
          '[&_hr]:my-6 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-800',
          '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-4',
          className
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Parse lines into structured blocks
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="my-2 list-decimal list-inside space-y-1 text-xs text-slate-800 dark:text-slate-200">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {parseInline(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="my-2 list-disc list-inside space-y-1 text-xs text-slate-800 dark:text-slate-200">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {parseInline(item)}
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const rows = tableRows.slice(1).filter((r) => !r.every((c) => c.match(/^[-:]+$/)));
      blocks.push(
        <div key={`table-${blocks.length}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                    {parseInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 text-slate-700 dark:text-slate-300">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      blocks.push(
        <pre key={`code-${blocks.length}`} className="my-3 overflow-x-auto rounded-xl bg-slate-900 text-slate-100 p-3.5 font-mono text-[11px] leading-relaxed border border-slate-800">
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      );
      codeBlockLines = [];
      inCodeBlock = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Markdown Table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      blocks.push(
        <h1 key={i} className="mt-4 mb-2 text-lg font-black tracking-tight text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
          {parseInline(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push(
        <h2 key={i} className="mt-3.5 mb-1.5 text-base font-bold text-slate-900 dark:text-white">
          {parseInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(
        <h3 key={i} className="mt-3 mb-1 text-sm font-bold text-primary-700 dark:text-primary-300">
          {parseInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Callouts / Alerts (> [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING])
    if (line.startsWith('> [!NOTE]')) {
      flushList();
      blocks.push(
        <div key={i} className="my-2.5 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">{parseInline(line.replace('> [!NOTE]', '').trim() || 'Key Linguistic Note')}</div>
        </div>
      );
      continue;
    }
    if (line.startsWith('> [!TIP]')) {
      flushList();
      blocks.push(
        <div key={i} className="my-2.5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <Lightbulb className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{parseInline(line.replace('> [!TIP]', '').trim() || 'Teaching & Fluency Tip')}</div>
        </div>
      );
      continue;
    }
    if (line.startsWith('> [!IMPORTANT]')) {
      flushList();
      blocks.push(
        <div key={i} className="my-2.5 flex items-start gap-2.5 rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200">
          <BookmarkCheck className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
          <div className="flex-1">{parseInline(line.replace('> [!IMPORTANT]', '').trim() || 'Important Rule')}</div>
        </div>
      );
      continue;
    }
    if (line.startsWith('> [!WARNING]')) {
      flushList();
      blocks.push(
        <div key={i} className="my-2.5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">{parseInline(line.replace('> [!WARNING]', '').trim() || 'Common Pitfall / Error')}</div>
        </div>
      );
      continue;
    }

    // Standard Blockquote
    if (line.startsWith('> ')) {
      flushList();
      blocks.push(
        <blockquote key={i} className="my-2 border-l-3 border-primary-500 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 text-xs italic text-slate-700 dark:text-slate-300 rounded-r-lg">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      currentList.push(line.trim().slice(2));
      continue;
    }

    // Ordered list
    const matchOrdered = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (matchOrdered) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      currentList.push(matchOrdered[2]);
      continue;
    }

    // Standard paragraph
    flushList();
    if (line.trim() === '') {
      blocks.push(<div key={i} className="h-2" />);
    } else {
      blocks.push(
        <p key={i} className="my-1.5 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
          {parseInline(line)}
        </p>
      );
    }
  }

  flushList();
  flushTable();
  flushCodeBlock();

  return <div className={cn('space-y-1 text-xs select-text', className)}>{blocks}</div>;
}

// Inline formatting parser: **bold**, *italic*, <u>underline</u>, ~~strike~~, `code`, [text](url)
function parseInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by markdown delimiters
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>|~~.*?~~|`.*?`|\[.*?\]\(.*?\))/g);

  return tokens.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={idx} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return (
        <u key={idx} className="underline decoration-primary-500 underline-offset-2">
          {part.slice(3, -4)}
        </u>
      );
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return (
        <del key={idx} className="line-through text-slate-400">
          {part.slice(2, -2)}
        </del>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary-600 dark:text-primary-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

// Teacher Quick Snippet Templates
const SNIPPET_TEMPLATES = {
  lesson: [
    {
      label: 'Grammar Rule Box',
      icon: Lightbulb,
      template: '### Grammar Focus: [Rule Title]\n\n**Structure:** `Subject + [Verb Form] + Object`\n\n> [!NOTE]\n> In CEFR standard usage, emphasize this construction in formal communications.\n\n*Examples:*\n- *Positive:* Example sentence here.\n- *Negative:* Example negative sentence here.',
    },
    {
      label: 'Vocabulary Table',
      icon: TableIcon,
      template: '| Target Word | CEFR Level | Definition & Meaning | Practical Context Example |\n|---|---|---|---|\n| **Deliverable** | B2 | Tangible result or project product | *Our team completed all deliverables ahead of the quarterly deadline.* |\n| **Stakeholder** | B2 | Person with interest in the outcome | *We scheduled a briefing with key executive stakeholders.* |',
    },
    {
      label: 'Dialogue Script',
      icon: Edit3,
      template: '### Dialogue Exercise: Workplace Negotiation\n\n- **Speaker A (Project Lead):** *"Could we review the updated milestone targets for next week?"*\n- **Speaker B (Client Director):** *"Certainly. Let us confirm the budget allocations first."*\n\n> [!TIP]\n> Practice reading this dialogue aloud to build natural intonation and pacing.',
    },
  ],
  assignment: [
    {
      label: 'Essay & Writing Prompt',
      icon: Edit3,
      template: '### Task Instructions: Formal Business Report\n\nWrite a 200–250 word response addressing the prompt below:\n\n**Scenario:**\nYou are proposing an initiative to improve internal cross-team communication.\n\n**Key Points to Include:**\n1. State the primary challenge with the current process.\n2. Propose two concrete solutions using modal verbs (*could, should, would*).\n3. Summarize the expected benefits for executive leadership.\n\n> [!IMPORTANT]\n> Use appropriate formal vocabulary and maintain professional business tone throughout.',
    },
    {
      label: 'Grading Rubric',
      icon: TableIcon,
      template: '| Criterion | Weight | Distinction (90-100%) | Competent (70-89%) | Needs Focus (<70%) |\n|---|---|---|---|---|\n| **Vocabulary Range** | 30% | Sophisticated, precise CEFR B2 idioms | Clear with minor repetition | Limited or basic register |\n| **Grammar Accuracy** | 40% | Flawless complex sentence structures | Occasional minor tense slips | Frequent sentence fragments |\n| **Coherence & Flow** | 30% | Seamless transitions & paragraphing | Well-organized structure | Disjointed ideas |',
    },
  ],
  feedback: [
    {
      label: 'Coaching Feedback Format',
      icon: Sparkles,
      template: '### Pedagogical Coaching Review\n\n> [!TIP]\n> **Observed Strengths:**\n> - Strong command of formal workplace vocabulary.\n> - Good sentence variety and clear paragraph transitions.\n\n> [!WARNING]\n> **Target Areas for Improvement:**\n> - Pay attention to subject-verb agreement in complex conditional clauses.\n> - Practice using active voice rather than passive voice where possible.\n\n**Recommended Next Drill:** Complete the Unit 4 Quiz on Modal Auxiliaries to solidify tense consistency.',
    },
    {
      label: 'Quick Correction Note',
      icon: BookmarkCheck,
      template: '**Grammar Correction Note:**\n- *Original:* "She have been worked here since 3 years."\n- *Corrected:* "She **has been working** here **for** three years."\n\n*Rule Reminder:* Use *for* with durations of time (3 years) and *since* with specific starting points (2021).',
    },
  ],
  general: [
    {
      label: 'Key Takeaway Box',
      icon: Info,
      template: '> [!NOTE]\n> **Key Takeaway:** Summarize the core concept here to ensure maximum retention.',
    },
    {
      label: 'Common Mistakes Alert',
      icon: AlertTriangle,
      template: '> [!WARNING]\n> **Common Mistake:** Avoid confusing `affect` (verb) with `effect` (noun).',
    },
  ],
};

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Write content, grammar explanations, or detailed feedback...',
  minRows = 6,
  error,
  helperText,
  className,
  category = 'general',
}: RichTextEditorProps) {
  const [viewMode, setViewMode] = useState<'write' | 'preview' | 'split'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorId = useId();

  // Metrics
  const charCount = value?.length || 0;
  const wordCount = value?.trim() ? value.trim().split(/\s+/).length : 0;
  const readingTimeMins = Math.max(1, Math.ceil(wordCount / 180));

  // Selection insertion helper
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(start + prefix.length, newCursorPos);
    }, 0);
  };

  // Block insertion helper
  const insertBlock = (blockText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value ? `${value}\n\n${blockText}` : blockText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const separator = before.length > 0 && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const newValue = `${before}${separator}${blockText}${after.length > 0 && !after.startsWith('\n') ? '\n\n' : ''}${after}`;
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  // Insert line prefix (headings, lists, quotes)
  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const currentLine = value.substring(lineStart, end);

    const newValue = value.substring(0, lineStart) + prefix + currentLine + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length, end + prefix.length);
    }, 0);
  };

  const templates = [
    ...(SNIPPET_TEMPLATES[category] || []),
    ...SNIPPET_TEMPLATES.general,
  ];

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Optional Top Label & View Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label && (
          <label htmlFor={editorId} className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Edit3 className="h-3.5 w-3.5 text-primary-600" />
            {label}
          </label>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 text-[11px] font-semibold ml-auto">
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 transition-all cursor-pointer',
              viewMode === 'write'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            )}
            title="Editor Mode"
          >
            <Edit3 className="h-3 w-3" />
            <span>Write</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={cn(
              'hidden sm:flex items-center gap-1 rounded-md px-2 py-1 transition-all cursor-pointer',
              viewMode === 'split'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            )}
            title="Split Side-by-Side View"
          >
            <Columns className="h-3 w-3" />
            <span>Split</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 transition-all cursor-pointer',
              viewMode === 'preview'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            )}
            title="Live Rich Preview"
          >
            <Eye className="h-3 w-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Container Card */}
      <div
        className={cn(
          'rounded-2xl border bg-white dark:bg-slate-900 transition-all overflow-hidden shadow-xs',
          error
            ? 'border-destructive ring-1 ring-destructive'
            : 'border-slate-200 dark:border-slate-800 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20'
        )}
      >
        {/* Rich Formatting Toolbar (Always visible in Write and Split mode) */}
        {viewMode !== 'preview' && (
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-100 bg-slate-50/80 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900/80">
            {/* Formatting Action Buttons */}
            <div className="flex flex-wrap items-center gap-0.5">
              {/* Headings */}
              <div className="flex items-center border-r border-slate-200 pr-1 mr-1 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => insertLinePrefix('# ')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Heading 1"
                >
                  <Heading1 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix('## ')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Heading 2"
                >
                  <Heading2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix('### ')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Heading 3"
                >
                  <Heading3 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Text Styles */}
              <div className="flex items-center border-r border-slate-200 pr-1 mr-1 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**', 'bold text')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*', 'italic text')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<u>', '</u>', 'underlined text')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Underline"
                >
                  <UnderlineIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Strikethrough"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('`', '`', 'code')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Inline Code"
                >
                  <Code className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Lists & Quotes */}
              <div className="flex items-center border-r border-slate-200 pr-1 mr-1 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => insertLinePrefix('- ')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Bullet List"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix('1. ')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Numbered List"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix('> ')}
                  className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Quote Block"
                >
                  <Quote className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Structured Callout Blocks */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => insertBlock('> [!NOTE]\n> Key rule: Enter important linguistic explanation here.')}
                  className="rounded-md px-1.5 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50"
                  title="Insert Note Callout"
                >
                  + Note
                </button>
                <button
                  type="button"
                  onClick={() => insertBlock('> [!TIP]\n> Teaching tip: Suggest a practical practice habit here.')}
                  className="rounded-md px-1.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50"
                  title="Insert Practice Tip"
                >
                  + Tip
                </button>
                <button
                  type="button"
                  onClick={() => insertBlock('> [!WARNING]\n> Common error: Contrast incorrect vs correct usage.')}
                  className="rounded-md px-1.5 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50"
                  title="Insert Error Warning"
                >
                  + Pitfall
                </button>
              </div>
            </div>

            {/* Quick Template Dropdown */}
            {templates.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-400">Templates:</span>
                <div className="flex items-center gap-1">
                  {templates.slice(0, 2).map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertBlock(t.template)}
                      className="rounded-lg bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-900/60 transition-colors"
                      title={t.label}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editor Body */}
        <div className="relative">
          {viewMode === 'write' && (
            <textarea
              id={editorId}
              ref={textareaRef}
              rows={minRows}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full resize-y bg-transparent p-3.5 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none dark:text-white font-mono"
            />
          )}

          {viewMode === 'preview' && (
            <div className="min-h-[140px] p-4 max-h-[480px] overflow-y-auto custom-scrollbar bg-slate-50/40 dark:bg-slate-900/40">
              <RichTextRenderer content={value} />
            </div>
          )}

          {viewMode === 'split' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
              <textarea
                id={editorId}
                ref={textareaRef}
                rows={minRows}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full resize-none bg-transparent p-3.5 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none dark:text-white font-mono"
              />
              <div className="p-3.5 max-h-[360px] overflow-y-auto custom-scrollbar bg-slate-50/40 dark:bg-slate-900/40">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                  Live Preview
                </div>
                <RichTextRenderer content={value} />
              </div>
            </div>
          )}
        </div>

        {/* Editor Footer Status Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-3 py-1.5 text-[10px] font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
            <span>•</span>
            <span>~{readingTimeMins} min read</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Markdown & Callouts supported</span>
          </div>
        </div>
      </div>

      {/* Helper text or error */}
      {error && <p className="text-[11px] font-semibold text-destructive">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-500">{helperText}</p>}
    </div>
  );
}
