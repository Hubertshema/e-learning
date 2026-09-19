import { z } from 'zod';

export const cefrLevelEnum = z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export const skillTypeEnum = z.enum([
  'READING',
  'LISTENING',
  'SPEAKING',
  'WRITING',
  'GRAMMAR',
  'VOCABULARY',
  'PRONUNCIATION',
]);
export const teachingStyleEnum = z.enum([
  'TRADITIONAL',
  'COMMUNICATIVE',
  'TASK_BASED',
  'PROJECT_BASED',
  'MIXED',
]);

// 1. Chat request
export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional(),
  context: z
    .object({
      courseId: z.string().optional(),
      unitId: z.string().optional(),
      lessonId: z.string().optional(),
      cefrLevel: cefrLevelEnum.optional(),
    })
    .optional(),
});

// 2. Lesson Planner
export const generateLessonPlanSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters'),
  cefrLevel: cefrLevelEnum.default('B1'),
  targetSkill: skillTypeEnum.default('GRAMMAR'),
  durationMinutes: z.number().min(15).max(180).default(60),
  teachingStyle: teachingStyleEnum.default('COMMUNICATIVE'),
  courseId: z.string().optional(),
  unitId: z.string().optional(),
  classSize: z.number().min(1).max(200).default(25),
  customObjectives: z.array(z.string()).optional(),
  studentAgeGroup: z.string().optional().default('Teenagers & Adults'),
  learningContext: z.string().optional().default('General English'),
});

// 3. Activity Generator
export const generateActivitySchema = z.object({
  topic: z.string().min(2, 'Topic is required'),
  cefrLevel: cefrLevelEnum.default('B1'),
  skill: skillTypeEnum.default('GRAMMAR'),
  activityType: z
    .enum([
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
      'FILL_BLANKS',
      'MATCHING',
      'SENTENCE_ORDER',
      'SHORT_ANSWER',
      'SPEAKING_PRACTICE',
      'READING_COMPREHENSION',
      'LISTENING_QUIZ',
    ])
    .default('MULTIPLE_CHOICE'),
  itemCount: z.number().min(1).max(20).default(5),
  difficulty: z.enum(['EASY', 'NORMAL', 'HARD']).default('NORMAL'),
  lessonId: z.string().optional(),
});

// 4. Assessment Blueprint
export const generateAssessmentBlueprintSchema = z.object({
  title: z.string().min(2, 'Title required'),
  assessmentType: z.string().default('Formative Assessment'),
  cefrLevel: cefrLevelEnum.default('B1'),
  totalMarks: z.number().min(10).max(200).default(50),
  durationMinutes: z.number().min(10).max(180).default(45),
  skills: z.array(skillTypeEnum).min(1).default(['GRAMMAR', 'VOCABULARY']),
  bloomsTaxonomy: z
    .object({
      remember: z.number().min(0).max(100),
      understand: z.number().min(0).max(100),
      apply: z.number().min(0).max(100),
      analyze: z.number().min(0).max(100),
      evaluate: z.number().min(0).max(100),
      create: z.number().min(0).max(100),
    })
    .optional(),
});

// 5. Assessment Generator
export const generateAssessmentSchema = z.object({
  title: z.string().min(2),
  assessmentType: z.string().default('Quiz'),
  cefrLevel: cefrLevelEnum.default('B1'),
  topic: z.string().min(2),
  durationMinutes: z.number().default(45),
  totalMarks: z.number().default(50),
  sections: z
    .array(
      z.object({
        name: z.string(),
        skill: skillTypeEnum,
        questionCount: z.number(),
        marks: z.number(),
      })
    )
    .optional(),
  includeAnswerKey: z.boolean().default(true),
  includeRubric: z.boolean().default(true),
});

// 6. Assignment Generator
export const generateAssignmentSchema = z.object({
  title: z.string().min(2),
  cefrLevel: cefrLevelEnum.default('B1'),
  topic: z.string().min(2),
  skill: skillTypeEnum.default('WRITING'),
  maxScore: z.number().min(10).max(100).default(100),
  deadlineDays: z.number().min(1).max(30).default(7),
  lessonId: z.string().optional(),
});

// 7. Quiz Generator
export const generateQuizSchema = z.object({
  title: z.string().min(2),
  topic: z.string().min(2),
  cefrLevel: cefrLevelEnum.default('B1'),
  questionCount: z.number().min(3).max(20).default(5),
  passingScore: z.number().min(50).max(100).default(70),
  timeLimitMin: z.number().min(5).max(60).default(15),
  lessonId: z.string().optional(),
});

// 8. Rubric Generator
export const generateRubricSchema = z.object({
  title: z.string().min(2),
  skill: skillTypeEnum.default('SPEAKING'),
  cefrLevel: cefrLevelEnum.default('B1'),
  maxScore: z.number().min(10).max(100).default(20),
  criteriaCount: z.number().min(2).max(6).default(4),
});

// 9. Feedback Assistant
export const generateFeedbackSchema = z.object({
  studentSubmission: z.string().min(5, 'Student submission text required'),
  taskPrompt: z.string().min(2, 'Task prompt required'),
  cefrLevel: cefrLevelEnum.default('B1'),
  skill: skillTypeEnum.default('WRITING'),
  rubricCriteria: z.array(z.string()).optional(),
  preliminaryScore: z.number().optional(),
});

// 10. Performance Teaching Recommendations
export const generatePerformanceRecommendationSchema = z.object({
  classId: z.string().optional(),
  skillAverages: z.record(z.string(), z.number()).optional(),
  overallPassingRate: z.number().optional(),
  specificDifficulties: z.array(z.string()).optional(),
});
