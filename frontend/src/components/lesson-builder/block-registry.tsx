import React from 'react';
import {
  Heading as HeadingIcon,
  Type,
  FileText,
  Quote,
  AlertCircle,
  Image as ImageIcon,
  Video,
  Music,
  Paperclip,
  Minus,
  MousePointer,
  CheckCircle2,
  Layers,
  Link2,
  BarChart2,
  ClipboardCheck,
  Code as CodeIcon,
  Clock,
  Table as TableIcon,
  ListOrdered,
  Sparkles,
  Bot,
  BrainCircuit,
  MessageSquare,
} from 'lucide-react';
import { BlockCategory, BlockType, LessonBlock } from './types';

export interface BlockDefinition {
  id: BlockType;
  name: string;
  category: BlockCategory;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor?: string;
  defaultContent: () => Record<string, any>;
  defaultSettings: () => Record<string, any>;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // ── CONTENT ──────────────────────────────────────────────
  {
    id: 'heading',
    name: 'Heading',
    category: 'CONTENT',
    description: 'Large title or section header',
    icon: HeadingIcon,
    defaultContent: () => ({ text: '', level: 2 }),
    defaultSettings: () => ({ align: 'left', size: '2xl' }),
  },
  {
    id: 'text',
    name: 'Text & Paragraph',
    category: 'CONTENT',
    description: 'Clean readable text block with formatting',
    icon: Type,
    defaultContent: () => ({ text: '' }),
    defaultSettings: () => ({ align: 'left', size: 'base', color: 'default' }),
  },
  {
    id: 'callout',
    name: 'Callout Box',
    category: 'CONTENT',
    description: 'Important tip, warning, or highlighted note',
    icon: AlertCircle,
    defaultContent: () => ({
      title: '',
      text: '',
      variant: 'info',
    }),
    defaultSettings: () => ({ border: true, icon: true }),
  },
  {
    id: 'quote',
    name: 'Quote',
    category: 'CONTENT',
    description: 'Styled quotation or noteworthy statement',
    icon: Quote,
    defaultContent: () => ({
      quote: '',
      author: '',
    }),
    defaultSettings: () => ({ style: 'modern' }),
  },
  {
    id: 'image',
    name: 'Image',
    category: 'CONTENT',
    description: 'Visual diagram, photo, or illustration',
    icon: ImageIcon,
    defaultContent: () => ({
      url: '',
      alt: '',
      caption: '',
    }),
    defaultSettings: () => ({ width: 'full', rounded: 'xl', shadow: true }),
  },
  {
    id: 'video',
    name: 'Video Player',
    category: 'CONTENT',
    description: 'Embedded video lesson or YouTube/Vimeo stream',
    icon: Video,
    defaultContent: () => ({
      url: '',
      title: '',
      duration: '',
    }),
    defaultSettings: () => ({ autoplay: false, controls: true }),
  },
  {
    id: 'audio',
    name: 'Audio Clip',
    category: 'CONTENT',
    description: 'Native speaker pronunciation or listening drill',
    icon: Music,
    defaultContent: () => ({
      title: '',
      speaker: '',
      url: '',
    }),
    defaultSettings: () => ({ showTranscript: false, transcript: '' }),
  },
  {
    id: 'divider',
    name: 'Divider',
    category: 'CONTENT',
    description: 'Clean horizontal separator between sections',
    icon: Minus,
    defaultContent: () => ({ style: 'solid' }),
    defaultSettings: () => ({ spacing: 'normal' }),
  },
  {
    id: 'button',
    name: 'Action Button',
    category: 'CONTENT',
    description: 'Clickable call-to-action or resource link',
    icon: MousePointer,
    defaultContent: () => ({ label: 'Action Button', url: '', variant: 'primary' }),
    defaultSettings: () => ({ align: 'left', openNewTab: true }),
  },

  // ── INTERACTIVE ──────────────────────────────────────────
  {
    id: 'tabs',
    name: 'Tabbed Content Box',
    category: 'INTERACTIVE',
    description: 'Organize content into clean switchable tabs',
    icon: Layers,
    defaultContent: () => ({
      activeTab: 0,
      tabs: [
        { title: 'Overview', content: 'Key explanation or rule presentation.' },
        { title: 'Examples', content: 'Practical conversation or sentence examples.' },
        { title: 'Practice Notes', content: 'Helpful tips for mastering this concept.' },
      ],
    }),
    defaultSettings: () => ({ style: 'pills' }),
  },
  {
    id: 'quiz',
    name: 'Interactive Quiz',
    category: 'INTERACTIVE',
    description: 'Check comprehension with multiple-choice questions',
    icon: CheckCircle2,
    defaultContent: () => ({
      question: '',
      type: 'multiple_choice',
      options: ['', ''],
      correctAnswer: 0,
      explanation: '',
      points: 10,
    }),
    defaultSettings: () => ({ shuffleOptions: false, showFeedbackImmediately: true }),
  },
  {
    id: 'flashcards',
    name: 'Flashcard Deck',
    category: 'INTERACTIVE',
    description: 'Spaced repetition cards for vocabulary & concepts',
    icon: Layers,
    defaultContent: () => ({
      cards: [
        { id: '1', front: '', back: '' },
      ],
    }),
    defaultSettings: () => ({ allowShuffle: true, showFlipAnimation: true }),
  },
  {
    id: 'matching',
    name: 'Term Matching',
    category: 'INTERACTIVE',
    description: 'Pair concepts, terms with definitions or translations',
    icon: Link2,
    defaultContent: () => ({
      pairs: [
        { id: '1', left: '', right: '' },
      ],
    }),
    defaultSettings: () => ({ points: 10, randomize: true }),
  },
  {
    id: 'poll',
    name: 'Quick Poll',
    category: 'INTERACTIVE',
    description: 'Gather student sentiment or check opinion',
    icon: BarChart2,
    defaultContent: () => ({
      question: '',
      options: ['', ''],
    }),
    defaultSettings: () => ({ anonymous: true, showLiveResults: true }),
  },
  {
    id: 'assignment',
    name: 'Mini Assignment',
    category: 'INTERACTIVE',
    description: 'Open-ended submission or homework task prompt',
    icon: ClipboardCheck,
    defaultContent: () => ({
      title: '',
      instructions: '',
      maxPoints: 20,
      submissionType: 'text',
    }),
    defaultSettings: () => ({ dueDateEnabled: false }),
  },

  // ── LEARNING TOOLS ───────────────────────────────────────
  {
    id: 'code',
    name: 'Interactive Code Playground',
    category: 'LEARNING',
    description: 'Runnable code editor with live simulated output',
    icon: CodeIcon,
    defaultContent: () => ({
      language: 'javascript',
      starterCode: '',
      expectedOutput: '',
    }),
    defaultSettings: () => ({ runEnabled: true, readOnly: false }),
  },
  {
    id: 'timeline',
    name: 'Step Timeline',
    category: 'LEARNING',
    description: 'Chronological milestones or process walkthrough',
    icon: Clock,
    defaultContent: () => ({
      steps: [
        { title: '', desc: '' },
      ],
    }),
    defaultSettings: () => ({ layout: 'vertical' }),
  },
  {
    id: 'table',
    name: 'Data Table',
    category: 'LEARNING',
    description: 'Structured rows and columns for comparisons',
    icon: TableIcon,
    defaultContent: () => ({
      headers: ['Header 1', 'Header 2'],
      rows: [
        ['', ''],
      ],
    }),
    defaultSettings: () => ({ striped: true, bordered: true }),
  },
  {
    id: 'stepActivity',
    name: 'Step-by-Step Activity',
    category: 'LEARNING',
    description: 'Guided sequential exercise with progressive disclosure',
    icon: ListOrdered,
    defaultContent: () => ({
      steps: [
        { title: '', content: '' },
      ],
    }),
    defaultSettings: () => ({ requireCheckoff: true }),
  },

  // ── AI ───────────────────────────────────────────────────
  {
    id: 'aiTutor',
    name: 'AI Socratic Tutor',
    category: 'AI',
    description: 'Personalized interactive assistant trained on lesson scope',
    icon: Bot,
    defaultContent: () => ({
      tutorName: 'AI Socratic Tutor',
      instruction: '',
      scope: 'lesson',
      responseStyle: 'socratic',
      allowHints: true,
      starterQuestion: '',
    }),
    defaultSettings: () => ({ maxTokens: 250, temperature: 0.7 }),
  },
  {
    id: 'aiPractice',
    name: 'AI Dynamic Practice',
    category: 'AI',
    description: 'Generates unlimited adaptive drills for students',
    icon: BrainCircuit,
    defaultContent: () => ({
      topic: '',
      difficulty: 'medium',
      questionCount: 3,
      questionTypes: ['multiple_choice', 'short_answer'],
    }),
    defaultSettings: () => ({ adaptiveDifficulty: true }),
  },
  {
    id: 'aiFeedback',
    name: 'AI Writing & Answer Coach',
    category: 'AI',
    description: 'Instant automated assessment, grammar feedback & rubric hints',
    icon: Sparkles,
    defaultContent: () => ({
      prompt: '',
      rubricFocus: ['Clarity', 'Grammar', 'Accuracy'],
      minWords: 20,
    }),
    defaultSettings: () => ({ provideHints: true, showScoreBreakdown: true }),
  },
];

export const CATEGORY_LABELS: Record<BlockCategory, { label: string; badge: string }> = {
  CONTENT: { label: 'Content', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  INTERACTIVE: { label: 'Interactive', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  LEARNING: { label: 'Learning Tools', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  AI: { label: 'AI Powered', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
};

export function createNewBlock(type: BlockType, order: number): LessonBlock {
  const def = BLOCK_DEFINITIONS.find((b) => b.id === type);
  if (!def) {
    throw new Error(`Unknown block type: ${type}`);
  }

  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    order,
    content: def.defaultContent(),
    settings: def.defaultSettings(),
    visibility: {
      enabled: true,
    },
  };
}
