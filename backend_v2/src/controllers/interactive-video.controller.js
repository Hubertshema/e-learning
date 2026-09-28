import path from 'path';
import fs from 'fs';
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

  static async deleteResource(req, res, next) {
    try {
      const deleted = await InteractiveVideoModel.deleteResource(req.params.resourceId, userId(req));
      return deleted ? sendSuccess(res, { id: req.params.resourceId }, 'Resource deleted') : sendError(res, 'Resource not found', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async updateResource(req, res, next) {
    try {
      const result = await InteractiveVideoModel.updateResource(req.params.resourceId, userId(req), req.body);
      return result
        ? sendSuccess(res, result, 'Resource updated successfully')
        : sendError(res, 'Resource not found or unauthorized', 404, 'NOT_FOUND');
    } catch (error) { next(error); }
  }

  static async downloadResource(req, res, next) {
    try {
      const resource = await InteractiveVideoModel.getResourceForDownload(
        req.params.resourceId,
        userId(req),
        req.user?.role
      );

      if (!resource) {
        return sendError(res, 'Resource not found or unauthorized', 404, 'NOT_FOUND');
      }

      // High security enforcement:
      // If student and download permission is false, strictly forbid download
      if (req.user?.role === 'STUDENT' && !resource.canDownload) {
        return sendError(
          res,
          'Direct file download is strictly forbidden for this protected resource. The instructor has configured this material for secure view-only mode.',
          403,
          'DOWNLOAD_FORBIDDEN'
        );
      }

      const rawUrl = resource.url || '';
      const cleanTitle = (resource.title || 'document').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const filename = cleanTitle.toLowerCase().endsWith('.pdf') ? cleanTitle : `${cleanTitle}.pdf`;

      // If it's a locally stored upload file in /uploads
      if (rawUrl.includes('/uploads/')) {
        const uploadFileName = rawUrl.split('/uploads/')[1].split('?')[0].split('#')[0];
        const filePath = path.join(process.cwd(), 'uploads', uploadFileName);

        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          return res.download(filePath, filename);
        }
      }

      // If it's an external URL (Cloudinary, AWS S3, etc.)
      return res.redirect(rawUrl);
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
