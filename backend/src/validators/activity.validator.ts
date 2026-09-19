import { z } from 'zod';

export const createActivitySchema = z.object({
  title: z.string().min(3, 'Activity title is required'),
  type: z.enum([
    'MULTIPLE_CHOICE',
    'FILL_BLANKS',
    'MATCHING',
    'FLASHCARD',
    'SENTENCE_REORDER',
    'SPEAKING_PRACTICE',
    'READING_PASSAGE',
    'LISTENING_QUIZ',
  ]),
  instructions: z.string().optional(),
  orderIndex: z.number().int().default(1),
  questions: z.array(
    z.object({
      prompt: z.string().min(1, 'Prompt is required'),
      options: z.array(z.string()).default([]),
      correctAnswer: z.string().min(1, 'Correct answer is required'),
      explanation: z.string().optional(),
      audioPromptUrl: z.string().optional(),
      orderIndex: z.number().int().default(1),
    })
  ).min(1, 'At least one question/card is required'),
});

export const submitActivitySchema = z.object({
  scorePercentage: z.number().min(0).max(100),
  skillType: z.enum([
    'READING',
    'LISTENING',
    'SPEAKING',
    'WRITING',
    'GRAMMAR',
    'VOCABULARY',
    'PRONUNCIATION',
  ]).default('GRAMMAR'),
  timeSpentSec: z.number().int().nonnegative().default(60),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type SubmitActivityInput = z.infer<typeof submitActivitySchema>;
