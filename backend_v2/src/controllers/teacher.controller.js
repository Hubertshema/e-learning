import { TeacherModel } from '../models/teacher.model.js';
import { CourseModel } from '../models/course.model.js';
import { ClassModel } from '../models/class.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class TeacherController {
  /**
   * GET /api/v1/teacher/dashboard
   */
  static async getDashboard(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const stats = await TeacherModel.getDashboardStats(teacherId);
      return sendSuccess(res, stats, 'Teacher dashboard stats retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/courses
   */
  static async getCourses(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const courses = await TeacherModel.getCourses(teacherId);
      return sendSuccess(res, courses, 'Teacher courses retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/courses/:courseId
   */
  static async getCourseDetails(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const course = await TeacherModel.getCourseById(teacherId, req.params.courseId);
      if (!course) {
        return sendError(res, 'Course not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, course, 'Course details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/courses
   */
  static async createCourse(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const newCourse = await CourseModel.create({
        ...req.body,
        teacherId,
      });
      return sendSuccess(res, newCourse, 'Course created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/teacher/courses/:courseId
   */
  static async updateCourse(req, res, next) {
    try {
      const updated = await CourseModel.update(req.params.courseId, req.body);
      return sendSuccess(res, updated, 'Course updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/courses/:courseId/units
   */
  static async addUnit(req, res, next) {
    try {
      const unit = await TeacherModel.addUnit(req.params.courseId, req.body);
      return sendSuccess(res, unit, 'Unit created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/courses/:courseId/units/:unitId/lessons
   */
  static async addLesson(req, res, next) {
    try {
      const lesson = await TeacherModel.addLesson(req.params.unitId, req.body);
      return sendSuccess(res, lesson, 'Lesson created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/classes
   */
  static async getClasses(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const classes = await ClassModel.findByTeacherId(teacherId);
      return sendSuccess(res, classes, 'Teacher classes retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/classes/:classId
   */
  static async getClassDetails(req, res, next) {
    try {
      const classData = await ClassModel.findById(req.params.classId);
      if (!classData) {
        return sendError(res, 'Class not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, classData, 'Class details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/classes
   */
  static async createClass(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const newClass = await ClassModel.create({
        ...req.body,
        teacherId,
      });
      return sendSuccess(res, newClass, 'Class created successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}
