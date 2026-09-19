import { z } from 'zod';

export const ToggleUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL']),
  reason: z.string().optional(),
});

export const ApproveTeacherSchema = z.object({
  hourlyRate: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const RejectTeacherSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

export const CourseStatusSchema = z.object({
  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const UpdateEnrollmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']),
  expiresAt: z.string().datetime().optional(),
});

export const ExtendEnrollmentSchema = z.object({
  days: z.number().int().min(1, 'Must extend by at least 1 day').max(365, 'Cannot extend beyond 365 days at once'),
});

export const UpdateStudentLevelSchema = z.object({
  level: z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  reason: z.string().optional(),
});

export const VerifyPaymentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().optional(),
});

export const ResetUserPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const UpdateSettingsSchema = z.object({
  platformName: z.string().min(2).optional(),
  supportEmail: z.string().email().optional(),
  requireTeacherReview: z.boolean().optional(),
  allowStudentRegistration: z.boolean().optional(),
  allowTeacherRegistration: z.boolean().optional(),
  defaultCurrency: z.string().length(3).optional(),
  platformCommissionPercent: z.number().min(0).max(100).optional(),
});

export type ToggleUserStatusInput = z.infer<typeof ToggleUserStatusSchema>;
export type ApproveTeacherInput = z.infer<typeof ApproveTeacherSchema>;
export type RejectTeacherInput = z.infer<typeof RejectTeacherSchema>;
export type CourseStatusInput = z.infer<typeof CourseStatusSchema>;
export type UpdateEnrollmentStatusInput = z.infer<typeof UpdateEnrollmentStatusSchema>;
export type ExtendEnrollmentInput = z.infer<typeof ExtendEnrollmentSchema>;
export type UpdateStudentLevelInput = z.infer<typeof UpdateStudentLevelSchema>;
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
export type ResetUserPasswordInput = z.infer<typeof ResetUserPasswordSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;

