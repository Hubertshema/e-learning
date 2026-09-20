import { ClassModel } from '../models/class.model.js';
import { SocketService } from './socket.service.js';

export class ClassService {
  /**
   * Get teacher classes
   */
  static async getTeacherClasses(teacherId) {
    return ClassModel.findByTeacherId(teacherId);
  }

  /**
   * Get student classes
   */
  static async getStudentClasses(studentId) {
    return ClassModel.findByStudentId(studentId);
  }

  /**
   * Get class details
   */
  static async getClassDetails(classId) {
    const classData = await ClassModel.findById(classId);
    if (!classData) {
      const error = new Error('Class not found');
      error.statusCode = 404;
      error.code = 'CLASS_NOT_FOUND';
      throw error;
    }
    return classData;
  }

  /**
   * Create class
   */
  static async createClass(teacherId, data) {
    const newClass = await ClassModel.create({
      ...data,
      teacherId,
    });

    // Notify connected sockets
    SocketService.broadcast('class:created', {
      classId: newClass.id,
      name: newClass.name,
      teacherId,
    });

    return newClass;
  }
}
