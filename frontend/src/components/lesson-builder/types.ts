export type BlockCategory = 'CONTENT' | 'INTERACTIVE' | 'LEARNING' | 'AI';

export type BlockType =
  // Content
  | 'heading'
  | 'text'
  | 'richText'
  | 'quote'
  | 'callout'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'divider'
  | 'button'
  // Interactive
  | 'tabs'
  | 'quiz'
  | 'flashcards'
  | 'matching'
  | 'poll'
  | 'assignment'
  // Learning Tools
  | 'code'
  | 'timeline'
  | 'table'
  | 'stepActivity'
  // AI
  | 'aiTutor'
  | 'aiPractice'
  | 'aiFeedback';

export interface LessonTab {
  id: string;
  title: string;
}

export interface LessonBlock {
  id: string;
  type: BlockType;
  order: number;
  tabId?: string;
  content: Record<string, any>;
  settings: Record<string, any>;
  visibility: {
    enabled: boolean;
    studentIds?: string[];
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string | number;
  points: number;
  explanation?: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface LessonSettingsData {
  title: string;
  description: string;
  unitId: string;
  courseId: string;
  levelId: string;
  estimatedDuration: number;
  status: 'draft' | 'published';
  isFreePreview: boolean;
  objectives: string[];
  prerequisites: string[];
  completionRule: 'opened' | 'all_blocks' | 'quiz_passed' | 'min_score';
  minQuizScore?: number;
  accessScope: 'level' | 'course' | 'selected_students';
  tabs?: LessonTab[];
}

export interface LessonHistoryState {
  blocks: LessonBlock[];
  settings: LessonSettingsData;
}
