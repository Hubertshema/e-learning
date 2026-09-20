import { DiagnosticModel } from '../models/diagnostic.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class DiagnosticController {
  /**
   * GET /api/v1/teacher/diagnostic-quiz/questions
   */
  static async getTeacherQuestions(req, res, next) {
    try {
      const { level, isActive } = req.query;
      const questions = await DiagnosticModel.getQuestions({
        level,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      return sendSuccess(res, questions, 'Diagnostic questions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/diagnostic-quiz/questions
   */
  static async createQuestion(req, res, next) {
    try {
      const {
        category,
        skill,
        difficulty,
        prompt,
        audioText,
        options,
        correctAnswer,
        explanation,
        orderIndex,
        isActive,
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return sendError(res, 'Question prompt is required', 400, 'VALIDATION_ERROR');
      }

      if (!Array.isArray(options) || options.filter((o) => typeof o === 'string' && o.trim()).length < 2) {
        return sendError(res, 'At least 2 multiple choice options are required', 400, 'VALIDATION_ERROR');
      }

      if (!correctAnswer || typeof correctAnswer !== 'string' || !correctAnswer.trim()) {
        return sendError(res, 'Correct answer is required', 400, 'VALIDATION_ERROR');
      }

      const created = await DiagnosticModel.createQuestion({
        category,
        skill,
        difficulty: difficulty || 'B1',
        prompt: prompt.trim(),
        audioText: audioText?.trim() || null,
        options: options.map((o) => String(o).trim()).filter(Boolean),
        correctAnswer: correctAnswer.trim(),
        explanation: explanation?.trim() || null,
        orderIndex,
        isActive,
      });

      return sendSuccess(res, created, 'Diagnostic question created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/diagnostic-quiz/questions/bulk
   * Save multiple questions at once (e.g. from AI generator or import)
   */
  static async bulkCreateQuestions(req, res, next) {
    try {
      const { questions, replaceExisting = false } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        return sendError(res, 'Questions array is required and cannot be empty', 400, 'VALIDATION_ERROR');
      }

      // Basic validation for each question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.prompt || !q.correctAnswer) {
          return sendError(
            res,
            `Question #${i + 1} is missing prompt or correct answer`,
            400,
            'VALIDATION_ERROR'
          );
        }
      }

      const created = await DiagnosticModel.bulkCreateQuestions(questions, Boolean(replaceExisting));
      return sendSuccess(res, created, `${created.length} diagnostic questions saved to database successfully`, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/teacher/diagnostic-quiz/questions/:id
   */
  static async updateQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const {
        category,
        skill,
        difficulty,
        prompt,
        audioText,
        options,
        correctAnswer,
        explanation,
        orderIndex,
        isActive,
      } = req.body;

      const updated = await DiagnosticModel.updateQuestion(id, {
        category,
        skill,
        difficulty,
        prompt,
        audioText,
        options,
        correctAnswer,
        explanation,
        orderIndex,
        isActive,
      });

      return sendSuccess(res, updated, 'Diagnostic question updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teacher/diagnostic-quiz/questions/:id
   */
  static async deleteQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await DiagnosticModel.deleteQuestion(id);
      return sendSuccess(res, deleted, 'Diagnostic question deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/diagnostic-quiz/analytics
   */
  static async getTeacherAnalytics(req, res, next) {
    try {
      const analytics = await DiagnosticModel.getAnalytics();
      return sendSuccess(res, analytics, 'Diagnostic analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/public/captcha
   * Generate an anti-bot challenge with cryptographic validation
   */
  static async getCaptcha(req, res, next) {
    try {
      const captcha = DiagnosticModel.generateCaptcha();
      return sendSuccess(res, captcha, 'Captcha challenge generated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/public/diagnostic-quiz
   */
  static async getPublicQuestions(req, res, next) {
    try {
      const result = await DiagnosticModel.getPublicQuestions();
      return sendSuccess(res, result, 'Active diagnostic questions loaded');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/public/diagnostic-quiz/submit
   */
  static async submitPublicAttempt(req, res, next) {
    try {
      const { answers, captchaAnswer, captchaToken, placementTestId } = req.body;

      if (!Array.isArray(answers) || answers.length === 0) {
        return sendError(res, 'Answers array is required and cannot be empty', 400, 'VALIDATION_ERROR');
      }

      // Extract client IP and device user agent
      const forwarded = req.headers['x-forwarded-for'];
      const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || req.ip || '127.0.0.1';
      const cleanIp = rawIp.replace('::ffff:', '');
      const userAgent = req.headers['user-agent'] || null;

      const userId = req.user?.id || req.user?.userId || null;

      const result = await DiagnosticModel.submitAttempt({
        answers,
        ipAddress: cleanIp,
        userAgent,
        captchaAnswer,
        captchaToken,
        placementTestId,
        userId,
      });

      return sendSuccess(res, result, 'Diagnostic placement assessment evaluated successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}
