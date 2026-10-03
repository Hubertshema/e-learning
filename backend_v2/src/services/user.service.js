import { UserModel } from '../models/user.model.js';

export class UserService {
  /**
   * Get user profile with role-specific details
   */
  static async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (user.role === 'TEACHER') {
      user.teacherProfile = await UserModel.getTeacherProfile(userId);
    } else if (user.role === 'STUDENT') {
      user.studentProfile = await UserModel.getStudentProfile(userId);
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, data) {
    const allowed = ['firstName', 'lastName', 'phone', 'country', 'city', 'timezone', 'preferredLanguage', 'avatarUrl'];
    const fields = {};

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields[key] = data[key];
      }
    }

    if (Object.keys(fields).length > 0) {
      await UserModel.update(userId, fields);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (user.role === 'STUDENT') {
      const studentAllowed = ['nativeLanguage', 'targetLevel', 'learningGoals', 'preferredSchedule', 'bio', 'targetSkills'];
      const studentFields = {};
      for (const key of studentAllowed) {
        if (data[key] !== undefined) {
          studentFields[key] = data[key];
        }
      }
      if (Object.keys(studentFields).length > 0) {
        await UserModel.updateStudentProfile(userId, studentFields);
      }
    } else if (user.role === 'TEACHER') {
      const teacherAllowed = ['whatsapp', 'supportEmail', 'bio'];
      const teacherFields = {};
      for (const key of teacherAllowed) {
        if (data[key] !== undefined) {
          teacherFields[key] = data[key];
        }
      }
      if (Object.keys(teacherFields).length > 0) {
        await UserModel.updateTeacherProfile(userId, teacherFields);
      }
    }

    return this.getProfile(userId);
  }
}
