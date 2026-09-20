import { CourseModel } from '../models/course.model.js';

export class CourseService {
  /**
   * List published courses
   */
  static async listCourses(query = {}) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(query.limit || '12', 10)));
    const offset = (page - 1) * limit;

    const { courses, total } = await CourseModel.findPublishedCourses({
      level: query.level,
      category: query.category,
      limit,
      offset,
    });

    return { courses, total, page, limit };
  }

  /**
   * Get single course details
   */
  static async getCourseDetails(courseId) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }
    return course;
  }

  /**
   * Get courses taught by teacher
   */
  static async getTeacherCourses(teacherId) {
    return CourseModel.findByTeacherId(teacherId);
  }

  /**
   * Create course
   */
  static async createCourse(teacherId, data) {
    const slug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    return CourseModel.create({
      ...data,
      slug,
      teacherId,
    });
  }
}
