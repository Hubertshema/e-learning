import { Router } from 'express';
import { SuperadminController } from '../controllers/superadmin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all routes: Require valid JWT token & SUPERADMIN role
router.use(authenticate);
router.use(authorize('SUPERADMIN'));

// Platform Overview & KPIs
router.get('/overview', SuperadminController.getOverview);
router.get('/reports', SuperadminController.getReports);

// Teacher Management & Approvals
router.get('/teachers', SuperadminController.getTeachers);
router.post('/teachers/:id/approve', SuperadminController.approveTeacher);
router.post('/teachers/:id/reject', SuperadminController.rejectTeacher);
router.patch('/teachers/:id/status', SuperadminController.updateTeacherStatus);

// User Administration
router.post('/users/:id/reset-password', SuperadminController.resetUserPassword);

// Student Management
router.get('/students', SuperadminController.getStudents);
router.patch('/students/:id/status', SuperadminController.updateStudentStatus);

// Course Management
router.get('/courses', SuperadminController.getCourses);
router.patch('/courses/:id/status', SuperadminController.updateCourseStatus);

// Class / Cohort Management
router.get('/classes', SuperadminController.getClasses);
router.post('/classes', SuperadminController.createClass);
router.patch('/classes/:id', SuperadminController.updateClass);
router.delete('/classes/:id', SuperadminController.deleteClass);

// Payments & Financials
router.get('/payments', SuperadminController.getPayments);
router.post('/payments/:id/verify', SuperadminController.verifyPayment);

// Enrollments
router.get('/enrollments', SuperadminController.getEnrollments);
router.patch('/enrollments/:id/status', SuperadminController.updateEnrollmentStatus);
router.post('/enrollments/:id/status', SuperadminController.updateEnrollmentStatus);
router.patch('/enrollments/:id/extend', SuperadminController.extendEnrollment);
router.post('/enrollments/:id/extend', SuperadminController.extendEnrollment);

// System Audit Logs & Operational Ledgers
router.get('/audit-logs', SuperadminController.getAuditLogs);
router.get('/email-logs', SuperadminController.getEmailLogs);
router.post('/announcements', SuperadminController.broadcastAnnouncement);

// System Settings & Communication
router.get('/settings', SuperadminController.getSettings);
router.patch('/settings', SuperadminController.updateSettings);
router.get('/email-settings', SuperadminController.getEmailSettings);
router.post('/email-settings/test', SuperadminController.testEmailSettings);
router.get('/contact-messages', SuperadminController.getContactMessages);
router.post('/seed', SuperadminController.seedTestData);

export default router;
