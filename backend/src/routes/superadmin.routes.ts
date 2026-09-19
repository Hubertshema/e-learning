import { Router } from 'express';
import { superadminController } from '../controllers/superadmin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  ToggleUserStatusSchema,
  ApproveTeacherSchema,
  RejectTeacherSchema,
  CourseStatusSchema,
  UpdateEnrollmentStatusSchema,
  ExtendEnrollmentSchema,
  UpdateStudentLevelSchema,
  VerifyPaymentSchema,
  ResetUserPasswordSchema,
  UpdateSettingsSchema,
} from '../validators/superadmin.validator.js';

const router = Router();

// Strictly protect all Superadmin routes
router.use(authenticate);
router.use(authorize('SUPERADMIN'));

// Dashboard Overview
router.get('/overview', superadminController.getOverview);

// Teacher Management
router.get('/teachers', superadminController.getTeachers);
router.post(
  '/teachers/:id/approve',
  validate(ApproveTeacherSchema),
  superadminController.approveTeacher
);
router.post(
  '/teachers/:id/reject',
  validate(RejectTeacherSchema),
  superadminController.rejectTeacher
);
router.patch(
  '/teachers/:id/status',
  validate(ToggleUserStatusSchema),
  superadminController.toggleUserStatus
);

// Student Management
router.get('/students', superadminController.getStudents);
router.patch(
  '/students/:id/status',
  validate(ToggleUserStatusSchema),
  superadminController.toggleUserStatus
);
router.patch(
  '/students/:id/level',
  validate(UpdateStudentLevelSchema),
  superadminController.updateStudentLevel
);

// User Security & Password Reset
router.post(
  '/users/:id/reset-password',
  validate(ResetUserPasswordSchema),
  superadminController.resetUserPassword
);

// Course Management & Moderation
router.get('/courses', superadminController.getCourses);
router.patch(
  '/courses/:id/status',
  validate(CourseStatusSchema),
  superadminController.updateCourseStatus
);

// Payment & Financial Ledger
router.get('/payments', superadminController.getPayments);
router.post(
  '/payments/:id/verify',
  validate(VerifyPaymentSchema),
  superadminController.verifyPayment
);

// Enrollment & Access Management
router.get('/enrollments', superadminController.getEnrollments);
router.patch(
  '/enrollments/:id/status',
  validate(UpdateEnrollmentStatusSchema),
  superadminController.updateEnrollmentStatus
);
router.post(
  '/enrollments/:id/extend',
  validate(ExtendEnrollmentSchema),
  superadminController.extendEnrollment
);

// Platform Governance & Settings
router.get('/settings', superadminController.getSettings);
router.patch(
  '/settings',
  validate(UpdateSettingsSchema),
  superadminController.updateSettings
);

// Audit Logs
router.get('/audit-logs', superadminController.getAuditLogs);

// Reports
router.get('/reports', superadminController.getReports);

// Email Delivery Logs & Management
router.get('/email-logs', superadminController.getEmailLogs);
router.get('/email-logs/:id', superadminController.getEmailLogById);
router.post('/announcements', superadminController.sendAnnouncement);
router.get('/email-settings', superadminController.getEmailSettings);
router.post('/email-settings/test', superadminController.sendTestEmail);

export default router;


