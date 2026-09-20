import { QuizModel } from '../models/quiz.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class QuizController {
  /**
   * POST /api/v1/teacher/quizzes
   */
  static async createQuiz(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const quiz = await QuizModel.createQuiz(teacherId, req.body);
      return sendSuccess(res, quiz, 'Quiz created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/quizzes
   */
  static async getQuizzes(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const quizzes = await QuizModel.getTeacherQuizzes(teacherId);
      return sendSuccess(res, quizzes, 'Quizzes retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/quizzes/:quizId
   */
  static async getQuizById(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const quiz = await QuizModel.getQuizById(teacherId, req.params.quizId);
      if (!quiz) {
        return sendError(res, 'Quiz not found', 404);
      }
      return sendSuccess(res, quiz, 'Quiz retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/quizzes/:quizId/analytics
   */
  static async getQuizAnalytics(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const analytics = await QuizModel.getQuizAnalytics(teacherId, req.params.quizId);
      if (!analytics) {
        return sendError(res, 'Quiz analytics not found', 404);
      }
      return sendSuccess(res, analytics, 'Quiz analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teacher/quizzes/:quizId
   */
  static async deleteQuiz(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      await QuizModel.deleteQuiz(teacherId, req.params.quizId);
      return sendSuccess(res, null, 'Quiz deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
