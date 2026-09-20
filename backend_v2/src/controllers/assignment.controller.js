import { AssignmentModel } from '../models/assignment.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class AssignmentController {
  /**
   * GET /api/v1/teacher/assignments
   */
  static async getAssignments(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const assignments = await AssignmentModel.getByTeacherId(teacherId);
      return sendSuccess(res, { assignments }, 'Assignments retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/assignments/:id
   */
  static async getAssignmentById(req, res, next) {
    try {
      const assignment = await AssignmentModel.getById(req.params.id);
      if (!assignment) {
        return sendError(res, 'Assignment not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, assignment, 'Assignment retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/assignments
   */
  static async createAssignment(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { lessonId, title, description, dueDate, maxScore, skillType } = req.body;

      if (!lessonId) {
        return sendError(res, 'lessonId is required to link the assignment to a lesson', 400, 'VALIDATION_ERROR');
      }
      if (!title || !String(title).trim()) {
        return sendError(res, 'Assignment title is required', 400, 'VALIDATION_ERROR');
      }
      if (!dueDate) {
        return sendError(res, 'Submission deadline (dueDate) is required', 400, 'VALIDATION_ERROR');
      }

      const assignment = await AssignmentModel.create({
        teacherId,
        lessonId,
        title: String(title).trim(),
        description: description || '',
        dueDate,
        maxScore: maxScore || 100,
        skillType: skillType || 'WRITING',
      });

      return sendSuccess(res, assignment, 'Assignment created and published to enrolled students', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/teacher/assignments/:id
   */
  static async updateAssignment(req, res, next) {
    try {
      const { title, description, dueDate, maxScore, skillType } = req.body;
      const updated = await AssignmentModel.update(req.params.id, {
        title,
        description,
        dueDate,
        maxScore,
        skillType,
      });
      return sendSuccess(res, updated, 'Assignment updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teacher/assignments/:id
   */
  static async deleteAssignment(req, res, next) {
    try {
      const deleted = await AssignmentModel.delete(req.params.id);
      return sendSuccess(res, deleted, 'Assignment and all submissions deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/assignments/:id/submissions
   */
  static async getSubmissions(req, res, next) {
    try {
      const submissions = await AssignmentModel.getSubmissions(req.params.id);
      return sendSuccess(res, submissions, 'Submissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/submissions/:submissionId/grade
   */
  static async gradeSubmission(req, res, next) {
    try {
      const { score, feedback } = req.body;

      if (score === undefined || score === null) {
        return sendError(res, 'Score is required to grade a submission', 400, 'VALIDATION_ERROR');
      }

      const graded = await AssignmentModel.gradeSubmission(req.params.submissionId, {
        score: Number(score),
        feedback: feedback || '',
      });

      return sendSuccess(res, graded, 'Submission graded and student progress updated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/assignments/lessons
   * Returns teacher's lessons for assignment creation dropdown
   */
  static async getTeacherLessons(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const lessons = await AssignmentModel.getTeacherLessons(teacherId);
      return sendSuccess(res, lessons, 'Teacher lessons retrieved for assignment creation');
    } catch (err) {
      next(err);
    }
  }
}
