import { InteractiveVideoModel } from '../models/interactive-video.model.js';
import { sendError, sendSuccess } from '../utils/response.util.js';

const userId = (req) => req.user.id || req.user.userId;

export class InteractiveVideoController {
  static async getTeacherLesson(req, res, next) {
    try {
      const result = await InteractiveVideoModel.getForTeacher(req.params.lessonId, userId(req));
      return result ? sendSuccess(res, result) : sendError(res, 'Interactive video not found', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async saveLesson(req, res, next) {
    try {
      const result = await InteractiveVideoModel.upsert(req.params.lessonId, userId(req), req.body);
      return result ? sendSuccess(res, result) : sendError(res, 'Lesson not found or not owned by you', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async saveActivity(req, res, next) {
    try {
      const result = await InteractiveVideoModel.saveActivity(req.params.lessonId, userId(req), req.body);
      return result ? sendSuccess(res, result, 'Activity saved', 201) : sendError(res, 'Lesson not found or not owned by you', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async generateActivities(req, res, next) {
    try {
      const result = await InteractiveVideoModel.generateActivities(req.params.lessonId, userId(req), req.body);
      return result ? sendSuccess(res, result, 'Activities generated', 200) : sendError(res, 'Lesson not found or not owned by you', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async deleteActivity(req, res, next) {
    try {
      const deleted = await InteractiveVideoModel.deleteActivity(req.params.activityId, userId(req));
      return deleted ? sendSuccess(res, { id: req.params.activityId }) : sendError(res, 'Activity not found', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async addResource(req, res, next) {
    try {
      const result = await InteractiveVideoModel.addResource(req.params.lessonId, userId(req), req.body);
      return result ? sendSuccess(res, result, 'Resource added', 201) : sendError(res, 'Lesson not found or not owned by you', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async analytics(req, res, next) {
    try {
      const result = await InteractiveVideoModel.analytics(req.params.lessonId, userId(req));
      return result ? sendSuccess(res, result) : sendError(res, 'Lesson not found', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async getStudentLesson(req, res, next) {
    try {
      const result = await InteractiveVideoModel.getForStudent(req.params.lessonId, userId(req), req.user?.role);
      return result ? sendSuccess(res, result) : sendError(res, 'Interactive video is unavailable', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async submitAttempt(req, res, next) {
    try {
      const result = await InteractiveVideoModel.submitAttempt(req.params.activityId, userId(req), req.body.answer, req.user?.role);
      return result ? sendSuccess(res, result) : sendError(res, 'Activity is unavailable', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async saveProgress(req, res, next) {
    try {
      const result = await InteractiveVideoModel.saveProgress(req.params.lessonId, userId(req), req.body, req.user?.role);
      return result ? sendSuccess(res, result) : sendError(res, 'Lesson is unavailable', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }
}
