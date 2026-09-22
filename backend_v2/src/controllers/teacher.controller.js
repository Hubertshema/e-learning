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

  /**
   * GET /api/v1/teacher/students
   */
  static async getStudents(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const search = req.query.search || '';
      const students = await TeacherModel.getStudents(teacherId, { search });
      return sendSuccess(res, { students }, 'Teacher students retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/students/:studentId/progress
   */
  static async getStudentProgress(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { studentId } = req.params;
      const data = await TeacherModel.getStudentProgress(teacherId, studentId);
      if (!data) {
        return sendError(res, 'Student not found or not enrolled in your courses', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, data, 'Student progress details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/students/:studentId/feedback
   */
  static async addStudentFeedback(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { studentId } = req.params;
      const { title, content, strengths, improvements } = req.body;
      const feedback = await TeacherModel.addStudentFeedback(teacherId, studentId, {
        title,
        content,
        strengths,
        improvements,
      });
      return sendSuccess(res, feedback, 'Feedback sent successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/teacher/students/:enrollmentId
   */
  static async updateStudentEnrollment(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { enrollmentId } = req.params;
      const updated = await TeacherModel.updateStudentEnrollment(teacherId, enrollmentId, req.body);
      if (!updated) {
        return sendError(res, 'Enrollment not found or unauthorized', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, updated, 'Student enrollment updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teacher/students/:enrollmentId
   */
  static async deleteStudentEnrollment(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { enrollmentId } = req.params;
      const deleted = await TeacherModel.deleteStudentEnrollment(teacherId, enrollmentId);
      if (!deleted) {
        return sendError(res, 'Enrollment not found or unauthorized', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, { id: enrollmentId }, 'Student enrollment deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}


