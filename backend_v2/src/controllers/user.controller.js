import { UserService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class UserController {
  /**
   * GET /api/v1/users/profile
   */
  static async getProfile(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      return sendSuccess(res, user, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/users/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const updated = await UserService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
}
