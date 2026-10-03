import { sendSuccess, sendError } from '../utils/response.util.js';
import { AdmissionModel } from '../models/admission.model.js';
import { emailService } from '../services/email.service.js';

export class AdmissionController {
  /**
   * POST /api/v1/student/apply (or /api/v1/auth/apply)
   * Student submits online application
   */
  static async submitApplication(req, res) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phone,
        nativeLanguage,
        currentEnglishLevel,
        motivation,
        learningGoals,
      } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return sendError(res, 'First name, last name, email, and password are required', 400);
      }

      // Prohibit sending weak passwords; strictly require the strongest passwords only
      const hasLength = typeof password === 'string' && password.length >= 8;
      const hasUpper = typeof password === 'string' && /[A-Z]/.test(password);
      const hasNumber = typeof password === 'string' && /[0-9]/.test(password);
      const hasSymbol = typeof password === 'string' && /[^A-Za-z0-9]/.test(password);

      if (!hasLength || !hasUpper || !hasNumber || !hasSymbol) {
        return sendError(
          res,
          'Weak passwords are prohibited. Only the strongest passwords are accepted (minimum 8 characters, with at least one uppercase letter, one number, and one special symbol).',
          400,
          'WEAK_PASSWORD_PROHIBITED'
        );
      }

      const result = await AdmissionModel.submitApplication({
        firstName,
        lastName,
        email,
        password,
        phone,
        nativeLanguage,
        currentEnglishLevel,
        motivation,
        learningGoals,
      });

      // Dispatch notification emails asynchronously
      const fullName = `${firstName} ${lastName}`.trim();
      Promise.allSettled([
        emailService.sendApplicationSubmittedToStudent({
          email,
          name: fullName,
          level: currentEnglishLevel,
        }),
        emailService.sendNewApplicationAlertToAdmin({
          studentName: fullName,
          email,
          phone,
          currentEnglishLevel,
        }),
      ]).catch((err) => console.error('Error dispatching application emails:', err));

      return sendSuccess(res, result, 'Application submitted successfully. Waiting for faculty review.', 201);
    } catch (error) {
      console.error('Submit Application Error:', error);
      const statusCode = error.statusCode || 500;
      return sendError(res, error.message || 'Failed to submit application', statusCode);
    }
  }

  /**
   * GET /api/v1/student/admission-status
   * Current student's application, payment, and learning access status
   */
  static async getStudentStatus(req, res) {
    try {
      const studentId = req.user.id;
      const status = await AdmissionModel.getStudentStatus(studentId);
      if (!status) return sendError(res, 'Student status record not found', 404);

      return sendSuccess(res, status, 'Student admission status retrieved successfully');
    } catch (error) {
      console.error('Get Admission Status Error:', error);
      return sendError(res, 'Failed to fetch admission status', 500);
    }
  }

  /**
   * POST /api/v1/student/payment-proof
   * Student submits bank / mobile money payment proof
   */
  static async submitPaymentProof(req, res) {
    try {
      const studentId = req.user.id;
      const {
        amount,
        currency,
        paymentMethod,
        transactionRef,
        transactionReference,
        receiptUrl,
        proofUrl,
        paymentDate,
        notes,
      } = req.body;

      const resolvedRef = (transactionRef || transactionReference || '').trim();
      const resolvedReceipt = receiptUrl || proofUrl || '';

      if (!amount || Number(amount) <= 0) {
        return sendError(res, 'Please provide a valid payment amount', 400);
      }

      if (!resolvedRef) {
        return sendError(res, 'Transaction reference number is required', 400);
      }

      const payment = await AdmissionModel.submitPaymentProof(studentId, {
        amount: Number(amount),
        currency: currency || 'RWF',
        paymentMethod: paymentMethod || 'Mobile Money',
        transactionRef: resolvedRef,
        receiptUrl: resolvedReceipt,
        paymentDate,
        notes: notes || '',
      });

      // Dispatch billing alert to admin asynchronously
      AdmissionModel.getStudentStatus(studentId).then((status) => {
        if (status?.user) {
          const studentName = `${status.user.firstName || ''} ${status.user.lastName || ''}`.trim() || 'Student';
          emailService.sendPaymentProofAdminAlert({
            studentName,
            studentEmail: status.user.email,
            amount: Number(amount),
            currency: currency || 'RWF',
            transactionRef: resolvedRef,
          }).catch((err) => console.error('Error dispatching payment proof alert:', err));
        }
      }).catch((err) => console.error('Error fetching student profile for billing alert:', err));

      return sendSuccess(res, payment, 'Payment proof submitted successfully. Awaiting faculty verification.', 201);
    } catch (error) {
      console.error('Submit Payment Proof Error:', error);
      return sendError(res, error.message || 'Failed to submit payment proof', 400);
    }
  }

  /**
   * GET /api/v1/teacher/applications
   * Teacher lists applications with status filter
   */
  static async listApplications(req, res) {
    try {
      const { status = 'ALL', search = '', limit = 50, page = 1 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const result = await AdmissionModel.listApplications({
        status,
        search,
        limit: Number(limit),
        offset,
      });

      return sendSuccess(res, result, 'Applications retrieved successfully');
    } catch (error) {
      console.error('List Applications Error:', error);
      return sendError(res, 'Failed to fetch student applications', 500);
    }
  }

  /**
   * GET /api/v1/teacher/applications/:studentId
   * Teacher gets single student application & audit trail
   */
  static async getApplicationDetails(req, res) {
    try {
      const { studentId } = req.params;
      if (!studentId || studentId === 'undefined') {
        return sendError(res, 'Student ID parameter is missing or invalid', 400);
      }
      const details = await AdmissionModel.getStudentStatus(studentId);
      if (!details) return sendError(res, 'Student application not found', 404);

      return sendSuccess(res, details, 'Application details retrieved successfully');
    } catch (error) {
      console.error('Get Application Details Error:', error);
      return sendError(res, 'Failed to fetch application details', 500);
    }
  }

  /**
   * POST /api/v1/teacher/applications/:studentId/review
   * Teacher accepts or rejects an application
   */
  static async reviewApplication(req, res) {
    try {
      const teacherId = req.user.id;
      const { studentId } = req.params;
      const { decision, rejectionReason, paymentRequirement, levelId, notes } = req.body;

      if (!studentId || studentId === 'undefined') {
        return sendError(res, 'Student ID parameter is missing or invalid', 400);
      }

      if (!decision || !['ACCEPT', 'REJECT'].includes(decision)) {
        return sendError(res, 'Decision must be either ACCEPT or REJECT', 400);
      }

      const result = await AdmissionModel.reviewApplication(teacherId, studentId, {
        decision,
        rejectionReason,
        paymentRequirement,
        levelId,
        notes,
      });

      // Dispatch decision email to student asynchronously
      AdmissionModel.getStudentStatus(studentId).then((status) => {
        if (status?.user?.email) {
          const studentName = `${status.user.firstName || ''} ${status.user.lastName || ''}`.trim() || 'Student';
          const levelName = status.admission?.level?.name || null;
          emailService.sendAdmissionDecisionEmail({
            email: status.user.email,
            name: studentName,
            decision,
            rejectionReason,
            levelName,
          }).catch((err) => console.error('Error dispatching admission decision email:', err));
        }
      }).catch((err) => console.error('Error fetching student profile for admission email:', err));

      return sendSuccess(res, result, `Application successfully ${decision === 'ACCEPT' ? 'accepted' : 'rejected'}`);
    } catch (error) {
      console.error('Review Application Error:', error);
      return sendError(res, error.message || 'Failed to review application', 400);
    }
  }

  /**
   * POST /api/v1/teacher/students/direct
   * Teacher creates a student directly without application
   */
  static async createDirectStudent(req, res) {
    try {
      const teacherId = req.user.id;
      const { firstName, lastName, email, phone, password, levelId, paymentRequirement, notes } = req.body;

      if (!firstName || !lastName || !email) {
        return sendError(res, 'First name, last name, and email are required', 400);
      }

      const result = await AdmissionModel.createDirectStudent(teacherId, {
        firstName,
        lastName,
        email,
        phone,
        password,
        levelId,
        paymentRequirement,
        notes,
      });

      // Dispatch welcome credentials email to student asynchronously
      if (result?.user?.email) {
        const studentName = `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() || 'Student';
        emailService.sendDirectStudentWelcomeEmail({
          email: result.user.email,
          name: studentName,
          temporaryPassword: password || 'LinguaChris2026!',
        }).catch((err) => console.error('Error dispatching direct student welcome email:', err));
      }

      return sendSuccess(res, result, 'Direct student admitted successfully', 201);
    } catch (error) {
      console.error('Create Direct Student Error:', error);
      return sendError(res, error.message || 'Failed to create direct student', 400);
    }
  }

  /**
   * PATCH /api/v1/teacher/students/:studentId/payment-requirement
   * Teacher changes payment requirement (REQUIRED -> WAIVED/ALREADY_HANDLED unlocks access, etc.)
   */
  static async changePaymentRequirement(req, res) {
    try {
      const teacherId = req.user.id;
      const { studentId } = req.params;
      const { paymentRequirement, reason } = req.body;

      if (!studentId || studentId === 'undefined') {
        return sendError(res, 'Student ID parameter is missing or invalid', 400);
      }

      if (!paymentRequirement) {
        return sendError(res, 'Payment requirement is required', 400);
      }

      const result = await AdmissionModel.changePaymentRequirement(teacherId, studentId, {
        paymentRequirement,
        reason,
      });

      return sendSuccess(res, result, `Payment requirement updated to ${paymentRequirement}`);
    } catch (error) {
      console.error('Change Payment Requirement Error:', error);
      return sendError(res, error.message || 'Failed to update payment requirement', 400);
    }
  }

  /**
   * POST /api/v1/teacher/students/:studentId/verify-payment
   * Teacher verifies payment proof, unlocking learning access
   */
  static async verifyPaymentProof(req, res) {
    try {
      const teacherId = req.user.id;
      const { studentId } = req.params;
      const { paymentId, notes } = req.body;

      if (!studentId || studentId === 'undefined') {
        return sendError(res, 'Student ID parameter is missing or invalid', 400);
      }

      const result = await AdmissionModel.verifyPaymentProof(teacherId, studentId, {
        paymentId,
        notes,
      });

      // Dispatch payment approved & access unlocked email asynchronously
      AdmissionModel.getStudentStatus(studentId).then((status) => {
        if (status?.user?.email) {
          const studentName = `${status.user.firstName || ''} ${status.user.lastName || ''}`.trim() || 'Student';
          emailService.sendPaymentApprovedEmail({
            email: status.user.email,
            name: studentName,
            amount: status.latestPayment?.amount || 'Tuition',
            currency: status.latestPayment?.currency || 'RWF',
            transactionRef: status.latestPayment?.transactionRef || 'OFFICIAL',
          }).catch((err) => console.error('Error dispatching payment verified email:', err));
        }
      }).catch((err) => console.error('Error fetching student profile for payment approved email:', err));

      return sendSuccess(res, result, 'Payment verified successfully. Student learning access is now ACTIVE.');
    } catch (error) {
      console.error('Verify Payment Error:', error);
      return sendError(res, error.message || 'Failed to verify payment', 400);
    }
  }

  /**
   * POST /api/v1/teacher/students/:studentId/reject-payment
   * Teacher rejects payment proof
   */
  static async rejectPaymentProof(req, res) {
    try {
      const teacherId = req.user.id;
      const { studentId } = req.params;
      const { paymentId, reason } = req.body;

      if (!studentId || studentId === 'undefined') {
        return sendError(res, 'Student ID parameter is missing or invalid', 400);
      }

      const result = await AdmissionModel.rejectPaymentProof(teacherId, studentId, {
        paymentId,
        reason,
      });

      // Dispatch payment rejected email asynchronously
      AdmissionModel.getStudentStatus(studentId).then((status) => {
        if (status?.user?.email) {
          const studentName = `${status.user.firstName || ''} ${status.user.lastName || ''}`.trim() || 'Student';
          emailService.sendPaymentRejectedEmail({
            email: status.user.email,
            name: studentName,
            reason,
          }).catch((err) => console.error('Error dispatching payment rejected email:', err));
        }
      }).catch((err) => console.error('Error fetching student profile for payment rejected email:', err));

      return sendSuccess(res, result, 'Payment proof rejected. Student notified to resubmit.');
    } catch (error) {
      console.error('Reject Payment Error:', error);
      return sendError(res, error.message || 'Failed to reject payment', 400);
    }
  }

  /**
   * POST /api/v1/teacher/students/:studentId/enroll-level
   * Teacher enrolls student in a CEFR Level and all its courses
   */
  static async enrollStudentInLevel(req, res) {
    try {
      const teacherId = req.user.id;
      const { studentId } = req.params;
      const { levelId } = req.body;

      if (!studentId || studentId === 'undefined') {
        return sendError(res, 'Student ID parameter is missing or invalid', 400);
      }

      if (!levelId) {
        return sendError(res, 'Level ID is required', 400);
      }

      const result = await AdmissionModel.enrollStudentInLevel(teacherId, studentId, levelId);

      return sendSuccess(res, result, 'Student enrolled into level successfully');
    } catch (error) {
      console.error('Enroll in Level Error:', error);
      return sendError(res, error.message || 'Failed to enroll student in level', 400);
    }
  }
}
