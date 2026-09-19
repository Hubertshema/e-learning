import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service.js';
import { createActivitySchema, submitActivitySchema } from '../validators/activity.validator.js';

export class ActivityController {
  async getLessonActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const activities = await activityService.getLessonActivities(req.params.lessonId);
      res.status(200).json({ success: true, data: activities });
    } catch (error) {
      next(error);
    }
  }

  async createActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createActivitySchema.parse(req.body);
      const activity = await activityService.createActivity(req.params.lessonId, validated);
      res.status(201).json({ success: true, data: activity, message: 'Activity created' });
    } catch (error) {
      next(error);
    }
  }

  async submitActivityScore(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = submitActivitySchema.parse(req.body);
      const result = await activityService.submitActivityScore(
        req.user!.userId,
        req.params.activityId,
        validated
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();
