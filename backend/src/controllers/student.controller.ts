import { Request, Response, NextFunction } from 'express';
import { studentService } from '../services/student.service.js';
import {
  submitPaymentProofSchema,
  submitAssignmentSchema,
  completeLessonSchema,
  submitQuizSchema,
  submitPlacementTestSchema,
} from '../validators/student.validator.js';

export class StudentController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await studentService.getDashboard(req.user!.userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await studentService.getCourses(req.user!.userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCourseDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await studentService.getCourseLearningView(req.user!.userId, req.params.courseId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async submitPaymentProof(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = submitPaymentProofSchema.parse(req.body);
      const result = await studentService.submitPaymentProof(req.user!.userId, validated);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Payment proof submitted. Your instructor will review and activate your access shortly.',
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await studentService.getPayments(req.user!.userId);
      res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await studentService.getSubscription(req.user!.userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async completeLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = completeLessonSchema.parse(req.body);
      const result = await studentService.completeLesson(req.user!.userId, req.params.lessonId, validated);
      res.status(200).json({ success: true, data: result, message: 'Lesson progress recorded' });
    } catch (error) {
      next(error);
    }
  }

  async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const assignments = await studentService.getAssignments(req.user!.userId);
      res.status(200).json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  }

  async submitAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = submitAssignmentSchema.parse(req.body);
      const result = await studentService.submitAssignment(req.user!.userId, req.params.assignmentId, validated);
      res.status(200).json({ success: true, data: result, message: 'Assignment submitted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getQuizzes(req: Request, res: Response, next: NextFunction) {
    try {
      const quizzes = await studentService.getQuizzes(req.user!.userId);
      res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
      next(error);
    }
  }

  async submitQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = submitQuizSchema.parse(req.body);
      const result = await studentService.submitQuiz(req.user!.userId, req.params.quizId, validated);
      res.status(200).json({ success: true, data: result, message: 'Quiz evaluated' });
    } catch (error) {
      next(error);
    }
  }

  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await studentService.getProgress(req.user!.userId);
      res.status(200).json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  }

  async submitPlacementTest(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = submitPlacementTestSchema.parse(req.body);
      const result = await studentService.submitPlacementTest(req.user!.userId, validated);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const certificates = await studentService.getCertificates(req.user!.userId);
      res.status(200).json({ success: true, data: certificates });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await studentService.getProfile(req.user!.userId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await studentService.updateProfile(req.user!.userId, req.body);
      res.status(200).json({ success: true, data: profile, message: 'Profile updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const enrollments = await studentService.getEnrollments(req.user!.userId);
      res.status(200).json({ success: true, data: enrollments });
    } catch (error) {
      next(error);
    }
  }

  async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const attendance = await studentService.getAttendance(req.user!.userId);
      res.status(200).json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  }

  async getFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const feedback = await studentService.getFeedback(req.user!.userId);
      res.status(200).json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  }

  async getResults(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await studentService.getResults(req.user!.userId);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async getCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await studentService.getCalendar(req.user!.userId);
      res.status(200).json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async renewCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await studentService.renewCourse(req.user!.userId, {
        courseId: req.params.courseId,
        ...req.body,
      });
      res.status(201).json({
        success: true,
        data: result,
        message: 'Renewal payment submitted for verification',
      });
    } catch (error) {
      next(error);
    }
  }

  async requestAccountDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const result = await studentService.requestAccountDeletion(req.user!.userId, reason || 'User requested account closure');
      res.status(200).json({ success: true, message: 'Account deletion request submitted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();

