import { CourseService } from '../services/course.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.util.js';

export class CourseController {
  /**
   * GET /api/v1/courses
   */
  static async list(req, res, next) {
    try {
      const { courses, total, page, limit } = await CourseService.listCourses(req.query);
      return sendPaginated(res, courses, total, page, limit, 'Courses retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/courses/:id
   */
  static async getById(req, res, next) {
    try {
      const course = await CourseService.getCourseDetails(req.params.id);
      return sendSuccess(res, course, 'Course details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/courses
   */
  static async getTeacherCourses(req, res, next) {
    try {
      const courses = await CourseService.getTeacherCourses(req.user.id);
      return sendSuccess(res, courses, 'Teacher courses retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/courses
   */
  static async create(req, res, next) {
    try {
      const newCourse = await CourseService.createCourse(req.user.id, req.body);
      return sendSuccess(res, newCourse, 'Course created successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}
