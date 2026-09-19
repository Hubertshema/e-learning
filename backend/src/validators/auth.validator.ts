import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name is required').trim(),
  lastName: z.string().min(2, 'Last name is required').trim(),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
  phone: z.string().optional(),

  // Optional teacher-specific fields
  headline: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),

  // Optional student-specific fields
  nativeLanguage: z.string().optional(),
  currentLevel: z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  targetLevel: z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  learningGoals: z.array(z.string()).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email address required').toLowerCase().trim(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const GoogleAuthSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().optional().default(''),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
  avatarUrl: z.string().optional(),
  googleId: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
