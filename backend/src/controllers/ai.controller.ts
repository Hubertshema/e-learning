import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai/ai.service.js';
import { AIRepository } from '../repositories/ai.repository.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import {
  aiChatSchema,
  generateLessonPlanSchema,
  generateActivitySchema,
  generateAssessmentBlueprintSchema,
  generateAssessmentSchema,
  generateRubricSchema,
  generateFeedbackSchema,
  generatePerformanceRecommendationSchema,
} from '../validators/ai.validator.js';

export class AIController {
  /**
   * Helper to retrieve teacherId from current authenticated user
   */
  private static async getTeacherIdFromReq(req: Request): Promise<string> {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    if (!userId) {
      throw new Error('Authentication required.');
    }
    const profile = await AIRepository.getTeacherProfileByUserId(userId);
    if (!profile) {
      throw new Error('Active Teacher Profile not found for this account.');
    }
    return profile.id;
  }

  /**
   * POST /api/v1/ai/chat
   */
  public static async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const validated = aiChatSchema.parse(req.body);

      const result = await AIService.processChat(
        teacherId,
        validated.message,
        validated.conversationHistory,
        validated.context
      );

      sendSuccess(res, result, 'AI response generated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/lessons/generate
   */
  public static async generateLessonPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const validated = generateLessonPlanSchema.parse(req.body);

      const result = await AIService.generateLessonPlan(teacherId, validated);
      sendSuccess(res, result, 'Lesson plan generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/activities/generate
   */
  public static async generateActivitySet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const validated = generateActivitySchema.parse(req.body);

      const result = await AIService.generateActivitySet(teacherId, validated);
      sendSuccess(res, result, 'Activities generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/assessments/blueprint
   */
  public static async generateAssessmentBlueprint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const validated = generateAssessmentBlueprintSchema.parse(req.body);

      const result = await AIService.generateAssessmentBlueprint(teacherId, validated);
      sendSuccess(res, result, 'Assessment blueprint generated', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/assessments/generate
   */
  public static async generateAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const validated = generateAssessmentSchema.parse(req.body);

      const result = await AIService.generateAssessment(teacherId, validated);
      sendSuccess(res, result, 'Assessment generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/rubrics/generate
   */
  public static async generateRubric(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const validated = generateRubricSchema.parse(req.body);

      const result = await AIService.generateRubric(teacherId, validated);
      sendSuccess(res, result, 'Rubric matrix generated', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/feedback/generate
   */
  public static async generateFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const validated = generateFeedbackSchema.parse(req.body);

      const result = await AIService.generateFeedback(teacherId, validated);
      sendSuccess(res, result, 'Feedback suggestion generated', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/performance-recommendations
   */
  public static async generatePerformanceRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const validated = generatePerformanceRecommendationSchema.parse(req.body);

      const result = await AIService.generatePerformanceRecommendations(teacherId, validated);
      sendSuccess(res, result, 'Performance recommendations generated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ai/history
   */
  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const { type, status, search, page, limit } = req.query;

      const result = await AIService.getTeacherHistory(teacherId, {
        type: type as any,
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 15,
      });

      sendSuccess(res, result, 'AI History retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ai/history/:id
   */
  public static async getHistoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const { id } = req.params;

      const result = await AIService.getGenerationById(id, teacherId);
      if (!result) {
        sendError(res, 'AI Generation record not found', 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, result, 'AI Generation details retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/ai/history/:id
   */
  public static async updateHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const { id } = req.params;
      const { title, status, output } = req.body;

      await AIService.updateGeneration(id, teacherId, { title, status, output });
      sendSuccess(res, { id }, 'AI Generation updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/ai/history/:id
   */
  public static async deleteHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const { id } = req.params;

      await AIService.deleteGeneration(id, teacherId);
      sendSuccess(res, { id }, 'AI Generation record deleted');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/lessons/draft
   */
  public static async draftLessonContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const { prompt, title, cefrLevel, skills } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ success: false, message: 'Prompt is required.' });
        return;
      }

      const result = await AIService.draftLessonContent(teacherId, {
        prompt: prompt.trim(),
        title,
        cefrLevel,
        skills,
      });

      sendSuccess(res, result, 'Lesson content drafted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ai/stats
   */
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = await AIController.getTeacherIdFromReq(req);
      const stats = await AIService.getTeacherStats(teacherId);

      sendSuccess(res, stats, 'AI usage statistics retrieved');
    } catch (error) {
      next(error);
    }
  }
}
