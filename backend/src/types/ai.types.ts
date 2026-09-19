import { CEFRLevel, SkillType } from '@prisma/client';

export type AIGenerationType =
  | 'LESSON'
  | 'ACTIVITY'
  | 'ASSIGNMENT'
  | 'QUIZ'
  | 'EXAM'
  | 'ASSESSMENT'
  | 'RUBRIC'
  | 'ANSWER_KEY'
  | 'FEEDBACK'
  | 'GRADING_SUGGESTION'
  | 'CHAT'
  | 'PERFORMANCE_RECOMMENDATION';

export type { CEFRLevel, SkillType };

export type TeachingStyle = 'TRADITIONAL' | 'COMMUNICATIVE' | 'TASK_BASED' | 'PROJECT_BASED' | 'MIXED';

export type CognitiveLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

export interface BloomsTaxonomyDistribution {
  remember: number;
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
}

export interface LessonPlanSection {
  title: string;
  durationMinutes: number;
  teacherAction: string;
  studentAction: string;
  materials?: string[];
  differentiation?: {
    forLowerLevel?: string;
    forHigherLevel?: string;
  };
}

export interface GeneratedLessonPlan {
  title: string;
  courseTitle?: string;
  cefrLevel: CEFRLevel;
  durationMinutes: number;
  teachingStyle: TeachingStyle;
  targetSkill: SkillType;
  classSize?: number;
  learningObjectives: string[];
  prerequisites: string[];
  requiredMaterials: string[];
  warmup: LessonPlanSection;
  presentation: LessonPlanSection;
  guidedPractice: LessonPlanSection;
  collaborativeActivity: LessonPlanSection;
  independentPractice: LessonPlanSection;
  assessmentWrapUp: LessonPlanSection;
  differentiationNotes: string;
  homeworkAssignment: string;
  summaryKeyTakeaways: string[];
}

export interface ActivityQuestionItem {
  prompt: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANKS' | 'MATCHING' | 'SENTENCE_ORDER' | 'SHORT_ANSWER' | 'SPEAKING_PROMPT';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  rubricCriteria?: string[];
}

export interface GeneratedActivitySet {
  title: string;
  topic: string;
  cefrLevel: CEFRLevel;
  skill: SkillType;
  estimatedMinutes: number;
  instructions: string;
  passageOrScript?: string;
  items: ActivityQuestionItem[];
}

export interface AssessmentBlueprintItem {
  sectionTitle: string;
  skill: SkillType;
  questionCount: number;
  marks: number;
  cognitiveFocus: CognitiveLevel;
}

export interface GeneratedAssessmentBlueprint {
  title: string;
  assessmentType: string;
  cefrLevel: CEFRLevel;
  totalMarks: number;
  durationMinutes: number;
  bloomsDistribution: BloomsTaxonomyDistribution;
  sections: AssessmentBlueprintItem[];
}

export interface AssessmentSectionOutput {
  sectionName: string;
  instructions: string;
  totalMarks: number;
  questions: ActivityQuestionItem[];
}

export interface GeneratedAssessment {
  title: string;
  assessmentType: string;
  cefrLevel: CEFRLevel;
  durationMinutes: number;
  totalMarks: number;
  sections: AssessmentSectionOutput[];
  answerKey: Array<{
    questionIndex: number;
    questionPrompt: string;
    correctAnswer: string;
    markingGuidance: string;
    marks: number;
  }>;
  markingScheme?: Array<{
    criterion: string;
    maxMarks: number;
    description: string;
  }>;
}

export interface RubricMatrixTier {
  criterion: string;
  weightPercent?: number;
  levels: {
    excellent: string;
    good: string;
    developing: string;
    beginning: string;
  };
}

export interface GeneratedRubric {
  title: string;
  targetSkill: SkillType;
  cefrLevel: CEFRLevel;
  maxScore: number;
  criteria: RubricMatrixTier[];
}

export interface GeneratedFeedbackSuggestion {
  overallScoreSuggested?: number;
  strengths: string[];
  areasForImprovement: string[];
  specificComments: string;
  recommendedPracticeExercises: string[];
  suggestedTeacherNotes: string;
}

export interface PerformanceTeachingRecommendation {
  overallSummary: string;
  prioritySkills: Array<{
    skill: SkillType;
    currentAverageScore: number;
    recommendation: string;
    suggestedActivities: string[];
  }>;
  curriculumAdjustments: string[];
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AIQuotaUsage {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  remainingDaily: number;
}
