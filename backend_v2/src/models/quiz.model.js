import { query, transaction, parsePgArray } from '../config/database.js';
import { TeacherModel } from './teacher.model.js';
import crypto from 'crypto';

export class QuizModel {
  /**
   * Create a quiz with questions inside a transaction
   */
  static async createQuiz(teacherId, {
    lessonId,
    title,
    description = '',
    passingScore = 70,
    timeLimitMinutes = 15,
    isPublished = true,
    questions = [],
  }) {
    const teacherIds = await TeacherModel.resolveTeacherIds(teacherId);

    // Verify that the lesson belongs to a course owned by this teacher
    const lessonCheck = await query(
      `SELECT l.id 
       FROM "public"."lessons" l
       JOIN "public"."units" u ON u.id = l."unitId"
       JOIN "public"."courses" c ON c.id = u."courseId"
       WHERE l.id = $1 AND c."teacherId" = ANY($2)
       LIMIT 1`,
      [lessonId, teacherIds]
    );

    if (lessonCheck.rows.length === 0) {
      throw new Error('Lesson not found or you do not have permission to attach a quiz to it.');
    }

    const quizId = crypto.randomUUID();

    return await transaction(async (client) => {
      // 1. Insert quiz
      const quizRes = await client.query(
        `INSERT INTO "public"."quizzes" 
          (id, "lessonId", title, description, "passingScore", "timeLimitMin", "isPublished", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [quizId, lessonId, title, description, passingScore, timeLimitMinutes, isPublished]
      );

      const createdQuiz = quizRes.rows[0];

      // 2. Insert questions
      const createdQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionId = crypto.randomUUID();
        const optionsArray = Array.isArray(q.options) ? q.options : [];
        const qRes = await client.query(
          `INSERT INTO "public"."quiz_questions"
            (id, "quizId", "questionText", options, "correctAnswer", explanation, points, "orderIndex")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            questionId,
            quizId,
            q.prompt || q.questionText,
            optionsArray,
            q.correctAnswer,
            q.explanation || '',
            q.points || 10,
            q.orderIndex || i + 1,
          ]
        );
        createdQuestions.push({
          ...qRes.rows[0],
          options: parsePgArray(qRes.rows[0].options),
        });
      }

      createdQuiz.questions = createdQuestions;
      return createdQuiz;
    });
  }

  /**
   * Get all quizzes for a teacher
   */
  static async getTeacherQuizzes(teacherId) {
    const teacherIds = await TeacherModel.resolveTeacherIds(teacherId);

    const quizzesRes = await query(
      `SELECT q.*,
              l.title AS "lessonTitle",
              u.title AS "unitTitle",
              c.title AS "courseTitle",
              c.level AS "courseLevel",
              (SELECT COUNT(*) FROM "public"."quiz_questions" qq WHERE qq."quizId" = q.id) AS "questionCount",
              (SELECT COUNT(*) FROM "public"."quiz_attempts" qa WHERE qa."quizId" = q.id) AS "attemptCount"
       FROM "public"."quizzes" q
       JOIN "public"."lessons" l ON l.id = q."lessonId"
       JOIN "public"."units" u ON u.id = l."unitId"
       JOIN "public"."courses" c ON c.id = u."courseId"
       WHERE c."teacherId" = ANY($1)
       ORDER BY q."createdAt" DESC`,
      [teacherIds]
    );

    const quizIds = quizzesRes.rows.map((q) => q.id);
    let questions = [];

    if (quizIds.length > 0) {
      const qRes = await query(
        `SELECT * FROM "public"."quiz_questions" WHERE "quizId" = ANY($1) ORDER BY "orderIndex" ASC`,
        [quizIds]
      );
      questions = qRes.rows;
    }

    return quizzesRes.rows.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      passingScore: q.passingScore,
      timeLimitMinutes: q.timeLimitMin,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      lesson: {
        id: q.lessonId,
        title: q.lessonTitle,
        unit: {
          title: q.unitTitle,
          course: {
            title: q.courseTitle,
            level: q.courseLevel,
          },
        },
      },
      questionCount: parseInt(q.questionCount || 0, 10),
      attemptCount: parseInt(q.attemptCount || 0, 10),
      attempts: [],
      questions: questions
        .filter((quest) => quest.quizId === q.id)
        .map((quest) => ({
          ...quest,
          prompt: quest.questionText,
          options: parsePgArray(quest.options),
        })),
    }));
  }

  /**
   * Get single quiz by ID for teacher
   */
  static async getQuizById(teacherId, quizId) {
    const teacherIds = await TeacherModel.resolveTeacherIds(teacherId);

    const quizzesRes = await query(
      `SELECT q.*,
              l.title AS "lessonTitle",
              u.title AS "unitTitle",
              c.title AS "courseTitle",
              c.level AS "courseLevel",
              (SELECT COUNT(*) FROM "public"."quiz_questions" qq WHERE qq."quizId" = q.id) AS "questionCount",
              (SELECT COUNT(*) FROM "public"."quiz_attempts" qa WHERE qa."quizId" = q.id) AS "attemptCount"
       FROM "public"."quizzes" q
       JOIN "public"."lessons" l ON l.id = q."lessonId"
       JOIN "public"."units" u ON u.id = l."unitId"
       JOIN "public"."courses" c ON c.id = u."courseId"
       WHERE q.id = $1 AND c."teacherId" = ANY($2)
       LIMIT 1`,
      [quizId, teacherIds]
    );

    if (quizzesRes.rows.length === 0) {
      return null;
    }

    const q = quizzesRes.rows[0];
    const qRes = await query(
      `SELECT * FROM "public"."quiz_questions" WHERE "quizId" = $1 ORDER BY "orderIndex" ASC`,
      [quizId]
    );

    return {
      id: q.id,
      title: q.title,
      description: q.description,
      passingScore: q.passingScore,
      timeLimitMinutes: q.timeLimitMin,
      maxAttempts: q.maxAttempts || 3,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      lesson: {
        id: q.lessonId,
        title: q.lessonTitle,
        unit: {
          title: q.unitTitle,
          course: {
            title: q.courseTitle,
            level: q.courseLevel,
          },
        },
      },
      questionCount: parseInt(q.questionCount || 0, 10),
      attemptCount: parseInt(q.attemptCount || 0, 10),
      attempts: [],
      questions: qRes.rows.map((quest) => ({
        ...quest,
        prompt: quest.questionText,
        options: parsePgArray(quest.options),
      })),
    };
  }

  /**
   * Get quiz analytics for a teacher
   */
  static async getQuizAnalytics(teacherId, quizId) {
    const teacherIds = await TeacherModel.resolveTeacherIds(teacherId);

    // Verify quiz ownership
    const quizRes = await query(
      `SELECT q.id, q.title, q."passingScore", c.title AS "courseTitle"
       FROM "public"."quizzes" q
       JOIN "public"."lessons" l ON l.id = q."lessonId"
       JOIN "public"."units" u ON u.id = l."unitId"
       JOIN "public"."courses" c ON c.id = u."courseId"
       WHERE q.id = $1 AND c."teacherId" = ANY($2)
       LIMIT 1`,
      [quizId, teacherIds]
    );

    if (quizRes.rows.length === 0) {
      return null;
    }

    const quiz = quizRes.rows[0];

    // Get attempts
    const attemptsRes = await query(
      `SELECT qa.id, qa.score, qa.passed, qa."startedAt", qa."completedAt",
              COALESCE(u."firstName", 'Student') AS "firstName",
              COALESCE(u."lastName", '') AS "lastName",
              COALESCE(u.email, 'unknown@student.com') AS "email"
       FROM "public"."quiz_attempts" qa
       LEFT JOIN "public"."student_profiles" sp ON sp.id = qa."studentId"
       LEFT JOIN "public"."users" u ON (u.id = sp."userId" OR u.id = qa."studentId")
       WHERE qa."quizId" = $1
       ORDER BY qa."startedAt" DESC`,
      [quizId]
    );

    const attempts = attemptsRes.rows;
    const totalAttempts = attempts.length;

    let avgScore = 0;
    let maxScore = 0;
    let minScore = 0;
    let passRate = 0;

    if (totalAttempts > 0) {
      const scores = attempts.map((a) => Number(a.score) || 0);
      const totalScore = scores.reduce((sum, s) => sum + s, 0);
      avgScore = Math.round(totalScore / totalAttempts);
      maxScore = Math.round(Math.max(...scores));
      minScore = Math.round(Math.min(...scores));
      const passedCount = attempts.filter((a) => a.passed).length;
      passRate = Math.round((passedCount / totalAttempts) * 100);
    }

    const recentAttempts = attempts.map((a) => {
      const startTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const endTime = a.completedAt ? new Date(a.completedAt).getTime() : startTime;
      const timeSpentSec = Math.max(0, Math.round((endTime - startTime) / 1000));

      return {
        id: a.id,
        student: {
          user: {
            firstName: a.firstName,
            lastName: a.lastName,
            email: a.email,
          },
        },
        scorePercentage: Math.round(Number(a.score) || 0),
        isPassed: Boolean(a.passed),
        timeSpentSec,
        startedAt: a.startedAt || new Date().toISOString(),
      };
    });

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        courseTitle: quiz.courseTitle,
      },
      totalAttempts,
      avgScore,
      maxScore,
      minScore,
      passRate,
      recentAttempts,
    };
  }

  /**
   * Delete quiz by ID
   */
  static async deleteQuiz(teacherId, quizId) {
    const teacherIds = await TeacherModel.resolveTeacherIds(teacherId);

    // Verify ownership
    const check = await query(
      `SELECT q.id 
       FROM "public"."quizzes" q
       JOIN "public"."lessons" l ON l.id = q."lessonId"
       JOIN "public"."units" u ON u.id = l."unitId"
       JOIN "public"."courses" c ON c.id = u."courseId"
       WHERE q.id = $1 AND c."teacherId" = ANY($2)
       LIMIT 1`,
      [quizId, teacherIds]
    );

    if (check.rows.length === 0) {
      throw new Error('Quiz not found or you do not have permission to delete it.');
    }

    return await transaction(async (client) => {
      await client.query(`DELETE FROM "public"."quiz_questions" WHERE "quizId" = $1`, [quizId]);
      await client.query(`DELETE FROM "public"."quiz_attempts" WHERE "quizId" = $1`, [quizId]);
      const res = await client.query(`DELETE FROM "public"."quizzes" WHERE id = $1 RETURNING *`, [quizId]);
      return res.rows[0];
    });
  }
}
