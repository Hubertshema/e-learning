import { z } from 'zod';

export const submitPaymentProofSchema = z.object({
  courseId: z.string().uuid().optional(),
  planMonths: z.number().int().min(1).default(1),
  planName: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['MOBILE_MONEY', 'MTN_MOMO', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CARD', 'CASH']).default('MOBILE_MONEY'),
  transactionRef: z.string().min(3, 'Transaction reference is required'),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const submitAssignmentSchema = z.object({
  content: z.string().min(5, 'Content must be at least 5 characters long'),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
});

export const completeLessonSchema = z.object({
  timeSpentSec: z.number().int().nonnegative().default(60),
});

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedAnswer: z.string(),
    })
  ),
});

export const submitPlacementTestSchema = z.object({
  placementTestId: z.string().uuid().optional(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedAnswer: z.string(),
    })
  ),
});

export const updateStudentProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  nativeLanguage: z.string().optional(),
  targetLevel: z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  learningGoals: z.array(z.string()).optional(),
  preferredSchedule: z.string().optional(),
  englishExperience: z.string().optional(),
});

export const updateStudentSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  assignmentReminders: z.boolean().optional(),
  quizReminders: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(8).optional(),
});

export const renewCourseSchema = z.object({
  courseId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['MOBILE_MONEY', 'MTN_MOMO', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CARD', 'CASH']).default('MOBILE_MONEY'),
  transactionRef: z.string().min(3, 'Transaction reference is required'),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export type SubmitPaymentProofInput = z.infer<typeof submitPaymentProofSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type SubmitPlacementTestInput = z.infer<typeof submitPlacementTestSchema>;
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
export type UpdateStudentSettingsInput = z.infer<typeof updateStudentSettingsSchema>;
export type RenewCourseInput = z.infer<typeof renewCourseSchema>;
