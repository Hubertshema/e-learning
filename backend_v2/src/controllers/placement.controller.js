import { PlacementModel } from '../models/placement.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class PlacementController {
  // ================= TEACHER METHODS =================

  /**
   * GET /api/v1/teacher/placements
   */
  static async getPlacements(req, res, next) {
    try {
      const placements = await PlacementModel.getPlacements();
      return sendSuccess(res, placements, 'Placements retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/placements/analytics
   */
  static async getPlacementAnalytics(req, res, next) {
    try {
      const analytics = await PlacementModel.getPlacementAnalytics();
      return sendSuccess(res, analytics, 'Placement analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/placements/:id
   */
  static async getPlacementById(req, res, next) {
    try {
      const { id } = req.params;
      const placement = await PlacementModel.getPlacementById(id);
      if (!placement) {
        return sendError(res, `Placement with ID "${id}" not found`, 404, 'NOT_FOUND');
      }
      return sendSuccess(res, placement, 'Placement details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/placements
   */
  static async createPlacement(req, res, next) {
    try {
      const { title, description, courseId, isActive, questions } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Placement title is required', 400, 'VALIDATION_ERROR');
      }

      const created = await PlacementModel.createPlacement({
        title: title.trim(),
        description: description?.trim(),
        courseId,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        questions: Array.isArray(questions) ? questions : [],
      });

      return sendSuccess(res, created, 'Placement batch created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/teacher/placements/:id
   */
  static async updatePlacement(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, courseId, isActive } = req.body;

      const updated = await PlacementModel.updatePlacement(id, {
        title,
        description,
        courseId,
        isActive,
      });

      return sendSuccess(res, updated, 'Placement updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teacher/placements/:id
   */
  static async deletePlacement(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await PlacementModel.deletePlacement(id);
      return sendSuccess(res, deleted, 'Placement deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/placements/:id/questions
   */
  static async addQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const { level, skill, prompt, options, correctAnswer, orderIndex } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return sendError(res, 'Question prompt is required', 400, 'VALIDATION_ERROR');
      }

      if (!Array.isArray(options) || options.filter((o) => typeof o === 'string' && o.trim()).length < 2) {
        return sendError(res, 'At least 2 options are required', 400, 'VALIDATION_ERROR');
      }

      if (!correctAnswer || typeof correctAnswer !== 'string' || !correctAnswer.trim()) {
        return sendError(res, 'Correct answer is required', 400, 'VALIDATION_ERROR');
      }

      const question = await PlacementModel.addQuestion(id, {
        level: level || 'B1',
        skill: skill || 'GRAMMAR',
        prompt: prompt.trim(),
        options: options.map((o) => String(o).trim()).filter(Boolean),
        correctAnswer: correctAnswer.trim(),
        orderIndex,
      });

      return sendSuccess(res, question, 'Question added to placement successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/placements/:id/questions/bulk
   */
  static async bulkAddQuestions(req, res, next) {
    try {
      const { id } = req.params;
      const { questions } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        return sendError(res, 'Questions array cannot be empty', 400, 'VALIDATION_ERROR');
      }

      const created = await PlacementModel.bulkAddQuestions(id, questions);
      return sendSuccess(res, created, 'Questions added to placement batch successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/teacher/placements/questions/:questionId
   */
  static async updateQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const { level, skill, prompt, options, correctAnswer, orderIndex } = req.body;

      const updated = await PlacementModel.updateQuestion(questionId, {
        level,
        skill,
        prompt,
        options,
        correctAnswer,
        orderIndex,
      });

      return sendSuccess(res, updated, 'Question updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teacher/placements/questions/:questionId
   */
  static async deleteQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const deleted = await PlacementModel.deleteQuestion(questionId);
      return sendSuccess(res, deleted, 'Question deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/teacher/placements/:id/reorder
   */
  static async reorderQuestions(req, res, next) {
    try {
      const { id } = req.params;
      const { questionIds } = req.body;

      if (!Array.isArray(questionIds)) {
        return sendError(res, 'questionIds array is required', 400, 'VALIDATION_ERROR');
      }

      const questions = await PlacementModel.reorderQuestions(id, questionIds);
      return sendSuccess(res, questions, 'Questions reordered successfully');
    } catch (err) {
      next(err);
    }
  }

  // ================= STUDENT METHODS =================

  /**
   * GET /api/v1/student/placement-test
   */
  static async getStudentPlacementTest(req, res, next) {
    try {
      const { id } = req.query;
      const test = await PlacementModel.getStudentPlacementTest(id || null);

      if (!test) {
        return sendError(res, 'No active placement test is available at this time', 404, 'NOT_FOUND');
      }

      return sendSuccess(res, test, 'Active placement test retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/student/placements
   */
  static async getAvailablePlacements(req, res, next) {
    try {
      const placements = await PlacementModel.getPlacements();
      const activeOnly = placements.filter((p) => p.isActive);
      return sendSuccess(res, activeOnly, 'Available placement tests loaded');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/student/placement-test
   */
  static async submitStudentPlacementTest(req, res, next) {
    try {
      const studentId = req.user.id || req.user.userId;
      let { placementTestId, answers } = req.body;

      if (!Array.isArray(answers) || answers.length === 0) {
        return sendError(res, 'Answers array cannot be empty', 400, 'VALIDATION_ERROR');
      }

      // If placementTestId not provided, default to first active placement test
      if (!placementTestId) {
        const activeTest = await PlacementModel.getStudentPlacementTest();
        if (!activeTest) {
          return sendError(res, 'No active placement test found', 404, 'NOT_FOUND');
        }
        placementTestId = activeTest.id;
      }

      // Extract client IP and device user agent
      const forwarded = req.headers['x-forwarded-for'];
      const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || req.ip || '127.0.0.1';
      const cleanIp = rawIp.replace('::ffff:', '');
      const userAgent = req.headers['user-agent'] || null;

      const result = await PlacementModel.submitStudentAttempt(studentId, {
        placementTestId,
        answers,
        ipAddress: cleanIp,
        userAgent,
      });

      return sendSuccess(res, result, 'Placement test submitted and evaluated successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}
