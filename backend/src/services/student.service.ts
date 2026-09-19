import { studentRepository } from '../repositories/student.repository.js';
import {
  SubmitPaymentProofInput,
  SubmitAssignmentInput,
  CompleteLessonInput,
  SubmitQuizInput,
  SubmitPlacementTestInput,
} from '../validators/student.validator.js';

export class StudentService {
  async getDashboard(userId: string) {
    return studentRepository.getDashboardData(userId);
  }

  async getCourses(userId: string) {
    return studentRepository.getStudentCourses(userId);
  }

  async getCourseLearningView(userId: string, courseId: string) {
    return studentRepository.getCourseLearningView(userId, courseId);
  }

  async submitPaymentProof(userId: string, input: SubmitPaymentProofInput) {
    return studentRepository.submitPaymentProof(userId, input);
  }

  async getSubscription(userId: string) {
    return studentRepository.getStudentSubscriptionDetails(userId);
  }

  async getPayments(userId: string) {
    return studentRepository.getStudentPayments(userId);
  }

  async completeLesson(userId: string, lessonId: string, input: CompleteLessonInput) {
    return studentRepository.completeLesson(userId, lessonId, input);
  }

  async getAssignments(userId: string) {
    return studentRepository.getStudentAssignments(userId);
  }

  async submitAssignment(userId: string, assignmentId: string, input: SubmitAssignmentInput) {
    return studentRepository.submitAssignment(userId, assignmentId, input);
  }

  async getQuizzes(userId: string) {
    return studentRepository.getStudentQuizzes(userId);
  }

  async submitQuiz(userId: string, quizId: string, input: SubmitQuizInput) {
    return studentRepository.submitQuiz(userId, quizId, input);
  }

  async getProgress(userId: string) {
    return studentRepository.getStudentProgressAnalytics(userId);
  }

  async submitPlacementTest(userId: string, input: SubmitPlacementTestInput) {
    return studentRepository.submitPlacementTest(userId, input);
  }

  async getCertificates(userId: string) {
    return studentRepository.getStudentCertificates(userId);
  }

  async getProfile(userId: string) {
    return studentRepository.getStudentProfile(userId);
  }

  async updateProfile(userId: string, input: any) {
    return studentRepository.updateStudentProfile(userId, input);
  }

  async getEnrollments(userId: string) {
    return studentRepository.getStudentEnrollments(userId);
  }

  async getAttendance(userId: string) {
    return studentRepository.getStudentAttendance(userId);
  }

  async getFeedback(userId: string) {
    return studentRepository.getStudentFeedback(userId);
  }

  async getResults(userId: string) {
    return studentRepository.getStudentResults(userId);
  }

  async getCalendar(userId: string) {
    return studentRepository.getStudentCalendar(userId);
  }

  async renewCourse(userId: string, input: any) {
    return studentRepository.renewCourse(userId, input);
  }

  async requestAccountDeletion(userId: string, reason: string) {
    return studentRepository.requestAccountDeletion(userId, reason);
  }
}

export const studentService = new StudentService();
