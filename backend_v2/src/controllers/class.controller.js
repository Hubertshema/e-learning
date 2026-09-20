import { ClassService } from '../services/class.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class ClassController {
  /**
   * GET /api/v1/classes/teacher
   */
  static async getTeacherClasses(req, res, next) {
    try {
      const classes = await ClassService.getTeacherClasses(req.user.id);
      return sendSuccess(res, classes, 'Teacher classes retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/classes/student
   */
  static async getStudentClasses(req, res, next) {
    try {
      const classes = await ClassService.getStudentClasses(req.user.id);
      return sendSuccess(res, classes, 'Student classes retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/classes/:id
   */
  static async getById(req, res, next) {
    try {
      const classData = await ClassService.getClassDetails(req.params.id);
      return sendSuccess(res, classData, 'Class details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/classes
   */
  static async create(req, res, next) {
    try {
      const newClass = await ClassService.createClass(req.user.id, req.body);
      return sendSuccess(res, newClass, 'Class created successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}
