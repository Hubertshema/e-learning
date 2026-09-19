import { activityRepository } from '../repositories/activity.repository.js';
import { CreateActivityInput, SubmitActivityInput } from '../validators/activity.validator.js';

export class ActivityService {
  async getLessonActivities(lessonId: string) {
    return activityRepository.getLessonActivities(lessonId);
  }

  async createActivity(lessonId: string, input: CreateActivityInput) {
    return activityRepository.createActivity(lessonId, input);
  }

  async submitActivityScore(userId: string, activityId: string, input: SubmitActivityInput) {
    return activityRepository.submitActivityScore(userId, activityId, input);
  }
}

export const activityService = new ActivityService();
