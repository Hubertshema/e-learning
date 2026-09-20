import { query, transaction, parsePgArray } from '../config/database.js';
import crypto from 'crypto';

const VALID_LEVELS = new Set(['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const VALID_SKILLS = new Set(['READING', 'LISTENING', 'SPEAKING', 'WRITING', 'GRAMMAR', 'VOCABULARY', 'PRONUNCIATION']);

function sanitizeLevel(lvl) {
  if (!lvl) return 'B1';
  const upper = String(lvl).trim().toUpperCase();
  return VALID_LEVELS.has(upper) ? upper : 'B1';
}

function sanitizeSkill(skill) {
  if (!skill) return 'GRAMMAR';
  const upper = String(skill).trim().toUpperCase();
  if (VALID_SKILLS.has(upper)) return upper;
  if (upper.includes('READ')) return 'READING';
  if (upper.includes('LISTEN')) return 'LISTENING';
  if (upper.includes('WRITE')) return 'WRITING';
  if (upper.includes('SPEAK')) return 'SPEAKING';
  if (upper.includes('VOCAB') || upper.includes('MATCH')) return 'VOCABULARY';
  if (upper.includes('PRONUNC') || upper.includes('SPELL')) return 'PRONUNCIATION';
  return 'GRAMMAR';
}

export class PlacementModel {
  /**
   * Get all placement tests (batches) with question & attempt counts
   */
  static async getPlacements() {
    const res = await query(`
      SELECT 
        pt.*,
        (SELECT COUNT(*) FROM "public"."placement_questions" pq WHERE pq."placementTestId" = pt.id) AS "questionCount",
        (SELECT COUNT(*) FROM "public"."placement_attempts" pa WHERE pa."placementTestId" = pt.id) AS "attemptCount"
      FROM "public"."placement_tests" pt
      ORDER BY pt."createdAt" ASC
    `);

    return res.rows.map((row) => ({
      ...row,
      questionCount: parseInt(row.questionCount || 0, 10),
      attemptCount: parseInt(row.attemptCount || 0, 10),
    }));
  }

  /**
   * Get single placement test with all its questions
   */
  static async getPlacementById(id) {
    const testRes = await query(
      `SELECT * FROM "public"."placement_tests" WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (testRes.rows.length === 0) return null;

    const test = testRes.rows[0];
    const qRes = await query(
      `SELECT * FROM "public"."placement_questions" 
       WHERE "placementTestId" = $1 
       ORDER BY "orderIndex" ASC, id ASC`,
      [id]
    );

    test.questions = qRes.rows.map((q) => ({
      ...q,
      options: parsePgArray(q.options),
    }));

    return test;
  }

  /**
   * Create a new placement batch/test
   */
  static async createPlacement({
    title,
    description = '',
    courseId = null,
    isActive = true,
    questions = [],
  }) {
    const id = crypto.randomUUID();

    return await transaction(async (client) => {
      const testRes = await client.query(
        `INSERT INTO "public"."placement_tests" (id, title, description, "courseId", "isActive", "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [id, title, description || null, courseId || null, Boolean(isActive)]
      );

      const createdTest = testRes.rows[0];
      const createdQuestions = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qId = crypto.randomUUID();
        const optionsArray = Array.isArray(q.options) ? q.options : [];

        const qRes = await client.query(
          `INSERT INTO "public"."placement_questions"
            (id, "placementTestId", level, skill, prompt, options, "correctAnswer", "orderIndex")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            qId,
            id,
            sanitizeLevel(q.level || q.difficulty),
            sanitizeSkill(q.skill || q.questionType),
            q.prompt || q.question,
            optionsArray,
            q.correctAnswer || q.correct,
            Number(q.orderIndex) || i + 1,
          ]
        );

        createdQuestions.push({
          ...qRes.rows[0],
          options: parsePgArray(qRes.rows[0].options),
        });
      }

      createdTest.questions = createdQuestions;
      return createdTest;
    });
  }

  /**
   * Update placement test metadata
   */
  static async updatePlacement(id, { title, description, courseId, isActive }) {
    const res = await query(
      `UPDATE "public"."placement_tests"
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           "courseId" = COALESCE($3, "courseId"),
           "isActive" = COALESCE($4, "isActive")
       WHERE id = $5
       RETURNING *`,
      [title, description, courseId, isActive, id]
    );

    if (res.rows.length === 0) {
      throw new Error(`Placement test with ID "${id}" not found.`);
    }

    return res.rows[0];
  }

  /**
   * Delete placement test and its questions/attempts
   */
  static async deletePlacement(id) {
    return await transaction(async (client) => {
      await client.query(`DELETE FROM "public"."placement_questions" WHERE "placementTestId" = $1`, [id]);
      await client.query(`DELETE FROM "public"."placement_attempts" WHERE "placementTestId" = $1`, [id]);
      const res = await client.query(`DELETE FROM "public"."placement_tests" WHERE id = $1 RETURNING *`, [id]);
      if (res.rows.length === 0) {
        throw new Error(`Placement test with ID "${id}" not found.`);
      }
      return res.rows[0];
    });
  }

  /**
   * Add a question to a placement test
   */
  static async addQuestion(placementTestId, {
    level = 'B1',
    skill = 'GRAMMAR',
    prompt,
    options = [],
    correctAnswer,
    orderIndex,
  }) {
    const id = crypto.randomUUID();
    const optionsArray = Array.isArray(options) ? options : [];

    // If orderIndex not provided, set to max + 1
    let order = Number(orderIndex);
    if (!order) {
      const maxRes = await query(
        `SELECT COALESCE(MAX("orderIndex"), 0) AS max_order FROM "public"."placement_questions" WHERE "placementTestId" = $1`,
        [placementTestId]
      );
      order = parseInt(maxRes.rows[0]?.max_order || 0, 10) + 1;
    }

    const res = await query(
      `INSERT INTO "public"."placement_questions"
        (id, "placementTestId", level, skill, prompt, options, "correctAnswer", "orderIndex")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        placementTestId,
        sanitizeLevel(level),
        sanitizeSkill(skill),
        prompt,
        optionsArray,
        correctAnswer,
        order,
      ]
    );

    return {
      ...res.rows[0],
      options: parsePgArray(res.rows[0].options),
    };
  }

  /**
   * Update an existing placement question
   */
  static async updateQuestion(id, {
    level,
    skill,
    prompt,
    options,
    correctAnswer,
    orderIndex,
  }) {
    const existingRes = await query(
      `SELECT * FROM "public"."placement_questions" WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (existingRes.rows.length === 0) {
      throw new Error(`Placement question with ID "${id}" not found.`);
    }

    const existing = existingRes.rows[0];
    const optionsArray = Array.isArray(options) ? options : parsePgArray(existing.options);

    const res = await query(
      `UPDATE "public"."placement_questions"
       SET level = COALESCE($1, level),
           skill = COALESCE($2, skill),
           prompt = COALESCE($3, prompt),
           options = COALESCE($4, options),
           "correctAnswer" = COALESCE($5, "correctAnswer"),
           "orderIndex" = COALESCE($6, "orderIndex")
       WHERE id = $7
       RETURNING *`,
      [
        level !== undefined ? sanitizeLevel(level) : existing.level,
        skill !== undefined ? sanitizeSkill(skill) : existing.skill,
        prompt,
        optionsArray,
        correctAnswer,
        orderIndex !== undefined ? Number(orderIndex) : existing.orderIndex,
        id,
      ]
    );

    return {
      ...res.rows[0],
      options: parsePgArray(res.rows[0].options),
    };
  }

  /**
   * Delete a placement question
   */
  static async deleteQuestion(id) {
    const res = await query(
      `DELETE FROM "public"."placement_questions" WHERE id = $1 RETURNING *`,
      [id]
    );
    if (res.rows.length === 0) {
      throw new Error(`Placement question with ID "${id}" not found.`);
    }
    return res.rows[0];
  }

  /**
   * Bulk add questions to a placement test
   */
  static async bulkAddQuestions(placementTestId, questions = []) {
    return await transaction(async (client) => {
      const maxRes = await client.query(
        `SELECT COALESCE(MAX("orderIndex"), 0) AS max_order FROM "public"."placement_questions" WHERE "placementTestId" = $1`,
        [placementTestId]
      );
      let currentOrder = parseInt(maxRes.rows[0]?.max_order || 0, 10);

      const created = [];
      for (const q of questions) {
        currentOrder++;
        const id = crypto.randomUUID();
        const optionsArray = Array.isArray(q.options) ? q.options : [];
        const res = await client.query(
          `INSERT INTO "public"."placement_questions"
            (id, "placementTestId", level, skill, prompt, options, "correctAnswer", "orderIndex")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            id,
            placementTestId,
            sanitizeLevel(q.level || q.difficulty),
            sanitizeSkill(q.skill || q.questionType),
            q.prompt || q.question,
            optionsArray,
            q.correctAnswer || q.correct,
            currentOrder,
          ]
        );
        created.push({
          ...res.rows[0],
          options: parsePgArray(res.rows[0].options),
        });
      }
      return created;
    });
  }

  /**
   * Reorder questions in a placement test
   */
  static async reorderQuestions(placementTestId, orderedQuestionIds = []) {
    return await transaction(async (client) => {
      for (let i = 0; i < orderedQuestionIds.length; i++) {
        await client.query(
          `UPDATE "public"."placement_questions"
           SET "orderIndex" = $1
           WHERE id = $2 AND "placementTestId" = $3`,
          [i + 1, orderedQuestionIds[i], placementTestId]
        );
      }
      const updated = await client.query(
        `SELECT * FROM "public"."placement_questions" WHERE "placementTestId" = $1 ORDER BY "orderIndex" ASC`,
        [placementTestId]
      );
      return updated.rows.map((q) => ({
        ...q,
        options: parsePgArray(q.options),
      }));
    });
  }

  /**
   * Get placement analytics for teacher dashboard
   */
  static async getPlacementAnalytics() {
    // 1. Overall stats
    const statsRes = await query(`
      SELECT 
        COUNT(DISTINCT "studentId") AS "uniqueStudents",
        COUNT(*) AS "totalAttempts",
        COALESCE(ROUND(AVG("score")::numeric, 1), 0) AS "globalAvgScore"
      FROM "public"."placement_attempts"
    `);

    const testsCountRes = await query(`
      SELECT COUNT(*) AS "totalTestsCount",
             (SELECT COUNT(*) FROM "public"."placement_questions") AS "totalQuestionsCount"
      FROM "public"."placement_tests"
      WHERE "isActive" = true
    `);

    const stats = statsRes.rows[0];
    const totalUniqueParticipants = parseInt(stats?.uniqueStudents || 0, 10);
    const totalAttempts = parseInt(stats?.totalAttempts || 0, 10);
    const globalAverageScore = Number(stats?.globalAvgScore || 0);
    const totalPlacementsCount = parseInt(testsCountRes.rows[0]?.totalTestsCount || 0, 10);
    const totalQuestionsCount = parseInt(testsCountRes.rows[0]?.totalQuestionsCount || 0, 10);

    // 2. Performance & Attempts per Placement Batch
    const batchRes = await query(`
      SELECT 
        pt.id,
        pt.title,
        COUNT(pa.id) AS "attemptCount",
        COALESCE(ROUND(AVG(pa.score)::numeric, 1), 0) AS "avgScore",
        (SELECT COUNT(*) FROM "public"."placement_questions" pq WHERE pq."placementTestId" = pt.id) AS "questionCount"
      FROM "public"."placement_tests" pt
      LEFT JOIN "public"."placement_attempts" pa ON pa."placementTestId" = pt.id
      GROUP BY pt.id, pt.title
      ORDER BY pt."createdAt" ASC
    `);

    const placementBatches = batchRes.rows.map((b) => ({
      id: b.id,
      title: b.title,
      attemptCount: parseInt(b.attemptCount || 0, 10),
      avgScore: Number(b.avgScore || 0),
      questionCount: parseInt(b.questionCount || 0, 10),
    }));

    // 3. Level Distribution
    const levelRes = await query(`
      SELECT "recommendedLevel", COUNT(*) AS "count"
      FROM "public"."placement_attempts"
      GROUP BY "recommendedLevel"
    `);

    const levelDistribution = {
      PRE_A1: 0,
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    };
    for (const row of levelRes.rows) {
      if (row.recommendedLevel && levelDistribution[row.recommendedLevel] !== undefined) {
        levelDistribution[row.recommendedLevel] = parseInt(row.count, 10);
      }
    }

    // 4. Recent Attempts with User Profile Join
    const recentRes = await query(`
      SELECT 
        pa.*,
        pt.title AS "placementTitle",
        u."firstName",
        u."lastName",
        u."email",
        u."avatarUrl"
      FROM "public"."placement_attempts" pa
      JOIN "public"."placement_tests" pt ON pt.id = pa."placementTestId"
      LEFT JOIN "public"."users" u ON u."id" = pa."studentId"
      ORDER BY pa."createdAt" DESC
      LIMIT 50
    `);

    const recentAttempts = recentRes.rows.map((row) => ({
      id: row.id,
      placementTestId: row.placementTestId,
      placementTitle: row.placementTitle,
      studentId: row.studentId,
      user: {
        firstName: row.firstName || 'Candidate',
        lastName: row.lastName || '',
        email: row.email || '',
        avatarUrl: row.avatarUrl || null,
      },
      score: Number(row.score),
      recommendedLevel: row.recommendedLevel,
      answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers || [],
      createdAt: row.createdAt,
    }));

    return {
      totalUniqueParticipants,
      totalAttempts,
      globalAverageScore,
      totalPlacementsCount,
      totalQuestionsCount,
      placementBatches,
      levelDistribution,
      recentAttempts,
    };
  }

  /**
   * Get active placement test for student (sanitized without correctAnswer)
   */
  static async getStudentPlacementTest(placementTestId = null) {
    let sql = `SELECT * FROM "public"."placement_tests" 
               WHERE "isActive" = true 
                 AND (SELECT COUNT(*) FROM "public"."placement_questions" WHERE "placementTestId" = "placement_tests".id) > 0`;
    const params = [];

    if (placementTestId) {
      params.push(placementTestId);
      sql += ` AND id = $1`;
    }

    // When multiple placements exist, select one randomly so candidate never knows which one is chosen
    sql += ` ORDER BY RANDOM() LIMIT 1`;

    const testRes = await query(sql, params);
    if (testRes.rows.length === 0) return null;

    const test = testRes.rows[0];

    // Fetch questions in randomized order
    const qRes = await query(
      `SELECT id, "placementTestId", level, skill, prompt, options, "orderIndex"
       FROM "public"."placement_questions"
       WHERE "placementTestId" = $1
       ORDER BY RANDOM()`,
      [test.id]
    );

    test.questions = qRes.rows.map((q) => ({
      ...q,
      question: q.prompt,
      options: parsePgArray(q.options),
    }));

    // Mask the internal batch title so the candidate has no idea which placement they are doing
    test.title = 'English Proficiency Placement Test';
    test.description = 'Assess your baseline across Grammar, Vocabulary, Reading, and Listening to determine your starting CEFR level.';

    return test;
  }

  /**
   * Submit and grade student placement test attempt
   */
  static async submitStudentAttempt(studentId, { placementTestId, answers = [], ipAddress = '127.0.0.1', userAgent = null, captchaVerified = true }) {
    // 1. Fetch placement test with questions & correct answers
    const testRes = await query(
      `SELECT * FROM "public"."placement_tests" WHERE id = $1 LIMIT 1`,
      [placementTestId]
    );
    if (testRes.rows.length === 0) {
      throw new Error(`Placement test with ID "${placementTestId}" not found.`);
    }

    const qRes = await query(
      `SELECT * FROM "public"."placement_questions" WHERE "placementTestId" = $1 ORDER BY "orderIndex" ASC`,
      [placementTestId]
    );
    const questions = qRes.rows.map((q) => ({
      ...q,
      options: parsePgArray(q.options),
    }));

    if (questions.length === 0) {
      throw new Error('This placement test has no questions.');
    }

    // 2. Grade answers
    let correctCount = 0;
    const review = [];

    for (const q of questions) {
      const studentAns = answers.find(
        (a) => a.questionId === q.id || String(a.questionId) === String(q.id)
      );

      let selectedText = '';
      if (studentAns) {
        if (typeof studentAns.selectedOption === 'number' && q.options[studentAns.selectedOption]) {
          selectedText = q.options[studentAns.selectedOption];
        } else if (studentAns.selectedAnswer) {
          selectedText = String(studentAns.selectedAnswer).trim();
        }
      }

      const isCorrect =
        selectedText.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

      if (isCorrect) correctCount++;

      review.push({
        questionId: q.id,
        prompt: q.prompt,
        skill: q.skill,
        level: q.level,
        selectedAnswer: selectedText,
        correctAnswer: q.correctAnswer,
        isCorrect,
      });
    }

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // 3. Determine CEFR level
    let recommendedLevel = 'A1';
    if (score >= 90) recommendedLevel = 'C2';
    else if (score >= 80) recommendedLevel = 'C1';
    else if (score >= 65) recommendedLevel = 'B2';
    else if (score >= 50) recommendedLevel = 'B1';
    else if (score >= 35) recommendedLevel = 'A2';
    else if (score >= 20) recommendedLevel = 'A1';
    else recommendedLevel = 'PRE_A1';

    // 4. Record attempt into placement_attempts with IP and device metadata
    const attemptId = crypto.randomUUID();
    await query(
      `INSERT INTO "public"."placement_attempts"
        (id, "placementTestId", "studentId", score, "recommendedLevel", answers, "ipAddress", "userAgent", "captchaVerified", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        attemptId,
        placementTestId,
        studentId,
        score,
        recommendedLevel,
        JSON.stringify(review),
        ipAddress,
        userAgent,
        captchaVerified,
      ]
    );

    // 5. Update student profile level in student_profiles / users
    try {
      await query(
        `UPDATE "public"."student_profiles"
         SET "currentLevel" = $1
         WHERE "userId" = $2 OR id = $2`,
        [recommendedLevel, studentId]
      );
    } catch (e) {
      console.warn('Could not update student_profiles currentLevel:', e.message);
    }

    return {
      attemptId,
      score,
      totalQuestions,
      correctCount,
      recommendedLevel,
      message: `Evaluation completed! Your diagnostic score is ${score}%. Recommended CEFR level: ${recommendedLevel}.`,
      review,
    };
  }
}
