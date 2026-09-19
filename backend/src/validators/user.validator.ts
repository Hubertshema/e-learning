import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  preferredLanguage: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  
  // Teacher specific fields
  headline: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  qualifications: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),
  hourlyRate: z.number().nonnegative().optional(),
  languagesSpoken: z.array(z.string()).optional(),
  levelsTaught: z.array(z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'])).optional(),
  profileVisibility: z.enum(['PUBLIC', 'STUDENTS_ONLY', 'PRIVATE']).optional(),

  // Student specific fields
  nativeLanguage: z.string().optional().nullable(),
  currentLevel: z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  targetLevel: z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional().nullable(),
  learningGoals: z.array(z.string()).optional(),
  preferredSchedule: z.string().optional().nullable(),
  targetSkills: z.array(z.string()).optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const TeacherTeachingPreferencesSchema = z.object({
  levelsTaught: z.array(z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'])).optional(),
  specialties: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  defaultCourseDurationDays: z.number().int().positive().optional(),
  defaultPassingScore: z.number().min(0).max(100).optional(),
  defaultClassSize: z.number().int().positive().optional(),
  defaultCurrency: z.string().optional(),
});

export const TeacherPaymentSettingsSchema = z.object({
  payoutMethod: z.string().optional(),
  momoNumber: z.string().optional().nullable(),
  momoProvider: z.string().optional().nullable(),
  accountName: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankSwiftCode: z.string().optional().nullable(),
  paymentInstructions: z.string().optional().nullable(),
});

export const StudentLearningGoalsSchema = z.object({
  learningGoals: z.array(z.string()),
  customGoal: z.string().optional().nullable(),
  targetLevel: z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  targetSkills: z.array(z.string()).optional(),
});

export const StudentLearningPreferencesSchema = z.object({
  dailyLearningTargetMinutes: z.number().int().min(5).max(480).optional(),
  studyDays: z.array(z.string()).optional(),
  preferredStudyTimeSlot: z.string().optional().nullable(),
  preferredSchedule: z.string().optional().nullable(),
  reminderPreference: z.string().optional().nullable(),
});

export const StudentPrivacySchema = z.object({
  profileVisibility: z.enum(['PRIVATE', 'TEACHER_ONLY']),
});

export const AccountDeletionRequestSchema = z.object({
  reason: z.string().min(5, 'Please provide a brief reason for requesting account closure'),
  passwordConfirmation: z.string().min(1, 'Password confirmation is required'),
});

export const SuperadminPlatformSettingsSchema = z.object({
  platformName: z.string().min(1).optional(),
  logoUrl: z.string().optional().nullable(),
  platformDescription: z.string().optional().nullable(),
  supportEmail: z.string().email().optional(),
  supportPhone: z.string().optional().nullable(),
  defaultCurrency: z.string().optional(),
  defaultTimezone: z.string().optional(),
  defaultLanguage: z.string().optional(),
  requireTeacherReview: z.boolean().optional(),
  allowStudentRegistration: z.boolean().optional(),
  allowTeacherRegistration: z.boolean().optional(),
  platformCommissionPercent: z.number().min(0).max(100).optional(),
  cefrSettings: z.any().optional(),
  learningSettings: z.any().optional(),
  paymentSettings: z.any().optional(),
  emailSettings: z.any().optional(),
  securitySettings: z.any().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type TeacherTeachingPreferencesInput = z.infer<typeof TeacherTeachingPreferencesSchema>;
export type TeacherPaymentSettingsInput = z.infer<typeof TeacherPaymentSettingsSchema>;
export type StudentLearningGoalsInput = z.infer<typeof StudentLearningGoalsSchema>;
export type StudentLearningPreferencesInput = z.infer<typeof StudentLearningPreferencesSchema>;
export type StudentPrivacyInput = z.infer<typeof StudentPrivacySchema>;
export type AccountDeletionRequestInput = z.infer<typeof AccountDeletionRequestSchema>;
export type SuperadminPlatformSettingsInput = z.infer<typeof SuperadminPlatformSettingsSchema>;
