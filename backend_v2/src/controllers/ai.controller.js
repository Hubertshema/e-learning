import { AIService } from '../services/ai.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class AIController {
  /**
   * POST /api/v1/ai/lessons/draft
   */
  static async draftLessonContent(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { prompt, title, cefrLevel, skills } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return sendError(res, 'Prompt is required', 400, 'VALIDATION_ERROR');
      }

      const result = await AIService.draftLessonContent(teacherId, {
        prompt: prompt.trim(),
        title,
        cefrLevel,
        skills,
      });

      return sendSuccess(res, result, 'Lesson content drafted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/ai/chat
   */
  static async chat(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { messages, context } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return sendError(res, 'Messages array is required', 400, 'VALIDATION_ERROR');
      }

      const result = await AIService.chat(teacherId, { messages, context });
      return sendSuccess(res, result, 'Chat reply generated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/ai/stats
   */
  static async getStats(req, res) {
    return sendSuccess(res, {
      dailyCount: 5,
      dailyQuota: 100,
      monthlyCount: 25,
      monthlyQuota: 1000,
    });
  }
}
