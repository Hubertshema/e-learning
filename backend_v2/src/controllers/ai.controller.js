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
   * POST /api/v1/ai/quizzes/generate
   */
  static async generateQuizQuestions(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { lessonTitle, cefrLevel, topic, count } = req.body;

      if (!lessonTitle || typeof lessonTitle !== 'string') {
        return sendError(res, 'lessonTitle is required', 400, 'VALIDATION_ERROR');
      }

      const questions = await AIService.generateQuizQuestions(teacherId, {
        lessonTitle,
        cefrLevel: cefrLevel || 'B1',
        topic,
        count: count || 3,
      });

      return sendSuccess(res, questions, 'Quiz questions generated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/ai/quizzes/generate-advanced
   * Supports streaming SSE progress or JSON response
   */
  static async generateAdvancedQuiz(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const {
        instruction,
        cefrLevel = 'B1',
        skills = [],
        count = 5,
        questionTypeCounts,
        topic,
        lessonTitle,
        learningMaterial,
      } = req.body;

      const isSSE = req.headers.accept?.includes('text/event-stream');

      if (isSSE) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        let isAborted = false;
        req.on('close', () => {
          isAborted = true;
        });

        const sendEvent = (event, data) => {
          if (!isAborted) {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
          }
        };

        sendEvent('progress', { step: 1, message: `Analyzing instructions for CEFR ${cefrLevel}...` });

        setTimeout(() => {
          if (!isAborted) {
            sendEvent('progress', { step: 2, message: 'Formulating communicative tasks & answer keys...' });
          }
        }, 1500);

        setTimeout(() => {
          if (!isAborted) {
            sendEvent('progress', { step: 3, message: 'Validating distractors & pedagogical explanations...' });
          }
        }, 3000);

        const quiz = await AIService.generateAdvancedQuiz(teacherId, {
          instruction,
          cefrLevel,
          skills,
          count,
          questionTypeCounts,
          topic,
          lessonTitle,
          learningMaterial,
        });

        if (!isAborted) {
          sendEvent('complete', quiz);
          res.end();
        }
        return;
      }

      // Standard JSON response
      const quiz = await AIService.generateAdvancedQuiz(teacherId, {
        instruction,
        cefrLevel,
        skills,
        count,
        questionTypeCounts,
        topic,
        lessonTitle,
        learningMaterial,
      });

      return sendSuccess(res, quiz, 'Advanced quiz generated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/ai/quizzes/transform-question
   * Transform a single question: MAKE_EASIER, MAKE_HARDER, IMPROVE, ADD_EXPLANATION
   */
  static async transformQuestion(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { question, action, targetLevel, context } = req.body;

      if (!question || !action) {
        return sendError(res, 'Question and action are required', 400, 'VALIDATION_ERROR');
      }

      const transformed = await AIService.transformQuestion(teacherId, {
        question,
        action,
        targetLevel,
        context,
      });

      return sendSuccess(res, transformed, `Question updated successfully (${action})`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/ai/diagnostic/generate
   * Generates placement diagnostic questions with SSE streaming support & AbortController handling
   */
  static async generateDiagnosticQuiz(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const {
        instruction,
        cefrLevel = 'ALL',
        skills = [],
        count = 10,
        topic,
      } = req.body;

      const isSSE = req.headers.accept?.includes('text/event-stream');

      if (isSSE) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        let isAborted = false;
        req.on('close', () => {
          isAborted = true;
        });

        const sendEvent = (event, data) => {
          if (!isAborted) {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
          }
        };

        sendEvent('progress', { step: 1, message: `Analyzing CEFR diagnostic criteria for level: ${cefrLevel}...` });

        setTimeout(() => {
          if (!isAborted) {
            sendEvent('progress', { step: 2, message: 'Crafting communicative tasks & diagnostic distractors...' });
          }
        }, 1500);

        setTimeout(() => {
          if (!isAborted) {
            sendEvent('progress', { step: 3, message: 'Validating answer keys & academic rationale...' });
          }
        }, 3000);

        const questions = await AIService.generateDiagnosticQuestions(teacherId, {
          instruction,
          cefrLevel,
          skills,
          count: Math.max(1, Math.min(30, Number(count) || 10)),
          topic,
        });

        if (!isAborted) {
          sendEvent('complete', { questions });
          res.end();
        }
        return;
      }

      // Standard JSON response
      const questions = await AIService.generateDiagnosticQuestions(teacherId, {
        instruction,
        cefrLevel,
        skills,
        count: Math.max(1, Math.min(30, Number(count) || 10)),
        topic,
      });

      return sendSuccess(res, { questions }, 'Diagnostic questions generated successfully');
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
