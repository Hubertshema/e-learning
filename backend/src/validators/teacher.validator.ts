import { z } from 'zod';

export const CreateCourseSchema = z.object({
  title: z.string().min(3, 'Title is required').trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').trim(),
  summary: z.string().optional(),
  level: z.enum(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  category: z.string().default('General English'),
  price: z.number().min(0, 'Price cannot be negative'),
  currency: z.string().default('USD'),
  durationDays: z.number().int().min(1).default(90),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
  learningObjectives: z.array(z.string()).optional(),
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

export const CreateUnitSchema = z.object({
  title: z.string().min(2, 'Unit title is required').trim(),
  description: z.string().optional(),
  orderIndex: z.number().int().min(1).default(1),
  isPublished: z.boolean().default(true),
});

export const UpdateUnitSchema = CreateUnitSchema.partial();

export const CreateLessonSchema = z.object({
  title: z.string().min(2, 'Lesson title is required').trim(),
  description: z.string().optional(),
  skill: z.enum([
    'READING',
    'LISTENING',
    'SPEAKING',
    'WRITING',
    'GRAMMAR',
    'VOCABULARY',
    'PRONUNCIATION',
  ]),
  orderIndex: z.number().int().min(1).default(1),
  estimatedMinutes: z.number().int().min(5).default(30),
  isFreePreview: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sections: z
    .array(
      z.object({
        title: z.string().min(1),
        contentType: z.enum(['MARKDOWN', 'VIDEO', 'AUDIO', 'VOCABULARY']).default('MARKDOWN'),
        content: z.string().min(1),
        mediaUrl: z.string().url().optional().or(z.literal('')),
        orderIndex: z.number().int().default(1),
      })
    )
    .optional(),
});

export const UpdateLessonSchema = CreateLessonSchema.partial();

export const CreateClassSchema = z.object({
  name: z.string().min(2, 'Class name is required').trim(),
  code: z.string().trim().optional(),
  description: z.string().optional(),
  schedule: z.string().optional(),
  meetingLink: z.string().optional(),
  courseId: z.string().min(1, 'Valid Course ID is required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.number().int().optional(),
  maxStudents: z.number().int().min(1).default(30).optional(),
});

export const UpdateClassSchema = CreateClassSchema.partial();

export const ApprovePaymentSchema = z.object({
  notes: z.string().optional(),
});

export const RejectPaymentSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required'),
});

export const CreateAssignmentSchema = z.object({
  lessonId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(10),
  maxScore: z.number().int().min(10).default(100),
  dueDate: z.string().optional(),
  isPublished: z.boolean().default(true),
  targetClassId: z.string().uuid().optional(),
  submissionType: z.enum(['TEXT', 'FILE', 'AUDIO', 'BOTH']).default('TEXT'),
});

export const UpdateAssignmentSchema = CreateAssignmentSchema.partial();

export const GradeSubmissionSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(2, 'Feedback note is required'),
});

export const MarkAttendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  lessonId: z.string().uuid().optional(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      note: z.string().optional(),
    })
  ),
});

// Quiz Schemas
export const CreateQuizSchema = z.object({
  lessonId: z.string().uuid(),
  title: z.string().min(3, 'Quiz title is required'),
  description: z.string().optional(),
  timeLimitMinutes: z.number().int().min(1).default(15),
  passingScore: z.number().min(1).max(100).default(70),
  maxAttempts: z.number().int().min(1).default(3),
  isPublished: z.boolean().default(true),
  randomizeQuestions: z.boolean().default(false),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1, 'Question prompt is required'),
        questionType: z
          .enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANKS', 'MATCHING', 'ORDERING'])
          .default('MULTIPLE_CHOICE'),
        options: z.array(z.string()).default([]),
        correctAnswer: z.string().min(1, 'Correct answer is required'),
        explanation: z.string().optional(),
        points: z.number().int().min(1).default(10),
        orderIndex: z.number().int().default(1),
      })
    )
    .min(1, 'At least one question is required'),
});

export const UpdateQuizSchema = CreateQuizSchema.partial();

// Enrollment Actions
export const ExtendEnrollmentSchema = z.object({
  extensionDays: z.number().int().min(1).max(365).default(30),
  reason: z.string().optional(),
});

export const SuspendEnrollmentSchema = z.object({
  reason: z.string().min(3, 'Reason for suspension is required'),
});

// Content Library
export const UploadLibraryFileSchema = z.object({
  title: z.string().min(2, 'File title is required'),
  fileType: z.enum(['PDF', 'DOCX', 'AUDIO', 'VIDEO', 'IMAGE', 'WORKSHEET']).default('PDF'),
  fileUrl: z.string().url('Valid file URL is required'),
  fileSizeBytes: z.number().int().optional(),
  category: z.string().default('General'),
  courseId: z.string().uuid().optional(),
});

// Coaching Feedback
export const CreateStudentFeedbackSchema = z.object({
  title: z.string().default('Instructor Coaching Note'),
  content: z.string().min(5, 'Feedback content is required'),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  courseId: z.string().uuid().optional(),
});

// Filters
export const PaymentFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUBMITTED', 'VERIFIED']).optional(),
  courseId: z.string().uuid().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export const StudentFilterSchema = z.object({
  classId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  level: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export const AssignmentFilterSchema = z.object({
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export const AttendanceFilterSchema = z.object({
  classId: z.string().uuid().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const ExpiringFilterSchema = z.object({
  days: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 7)),
});

// Aliases
export const createCourseSchema = CreateCourseSchema;
export const updateCourseSchema = UpdateCourseSchema;
export const createUnitSchema = CreateUnitSchema;
export const updateUnitSchema = UpdateUnitSchema;
export const createLessonSchema = CreateLessonSchema;
export const updateLessonSchema = UpdateLessonSchema;
export const createClassSchema = CreateClassSchema;
export const updateClassSchema = UpdateClassSchema;
export const approvePaymentSchema = ApprovePaymentSchema;
export const rejectPaymentSchema = RejectPaymentSchema;
export const createAssignmentSchema = CreateAssignmentSchema;
export const updateAssignmentSchema = UpdateAssignmentSchema;
export const gradeSubmissionSchema = GradeSubmissionSchema;
export const markAttendanceSchema = MarkAttendanceSchema;
export const createQuizSchema = CreateQuizSchema;
export const updateQuizSchema = UpdateQuizSchema;
export const extendEnrollmentSchema = ExtendEnrollmentSchema;
export const suspendEnrollmentSchema = SuspendEnrollmentSchema;
export const uploadLibraryFileSchema = UploadLibraryFileSchema;
export const createStudentFeedbackSchema = CreateStudentFeedbackSchema;
export const paymentFilterSchema = PaymentFilterSchema;
export const studentFilterSchema = StudentFilterSchema;
export const assignmentFilterSchema = AssignmentFilterSchema;
export const attendanceFilterSchema = AttendanceFilterSchema;
export const expiringFilterSchema = ExpiringFilterSchema;

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type CreateUnitInput = z.infer<typeof CreateUnitSchema>;
export type UpdateUnitInput = z.infer<typeof UpdateUnitSchema>;
export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>;
export type CreateClassInput = z.infer<typeof CreateClassSchema>;
export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;
export type ApprovePaymentInput = z.infer<typeof ApprovePaymentSchema>;
export type RejectPaymentInput = z.infer<typeof RejectPaymentSchema>;
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof GradeSubmissionSchema>;
export type MarkAttendanceInput = z.infer<typeof MarkAttendanceSchema>;
export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;
export type UpdateQuizInput = z.infer<typeof UpdateQuizSchema>;
export type ExtendEnrollmentInput = z.infer<typeof ExtendEnrollmentSchema>;
export type SuspendEnrollmentInput = z.infer<typeof SuspendEnrollmentSchema>;
export type UploadLibraryFileInput = z.infer<typeof UploadLibraryFileSchema>;
export type CreateStudentFeedbackInput = z.infer<typeof CreateStudentFeedbackSchema>;
export type PaymentFilterInput = z.infer<typeof PaymentFilterSchema>;
export type StudentFilterInput = z.infer<typeof StudentFilterSchema>;
export type AssignmentFilterInput = z.infer<typeof AssignmentFilterSchema>;
export type AttendanceFilterInput = z.infer<typeof AttendanceFilterSchema>;
export type ExpiringFilterInput = z.infer<typeof ExpiringFilterSchema>;
