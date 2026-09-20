import { query, transaction, parsePgArray } from '../config/database.js';
import { env } from '../config/env.js';
import crypto from 'crypto';

export class DiagnosticModel {
  /**
   * Get all diagnostic questions with optional level and active filters
   */
  static async getQuestions({ level, isActive } = {}) {
    let sql = `SELECT * FROM "public"."diagnostic_questions" WHERE 1=1`;
    const params = [];

    if (level && level !== 'ALL') {
      params.push(level);
      sql += ` AND "difficulty" = $${params.length}`;
    }

    if (typeof isActive === 'boolean') {
      params.push(isActive);
      sql += ` AND "isActive" = $${params.length}`;
    }

    sql += ` ORDER BY "orderIndex" ASC, "createdAt" ASC`;

    const res = await query(sql, params);
    return res.rows.map((row) => ({
      ...row,
      options: parsePgArray(row.options),
    }));
  }

  /**
   * Generate an anti-bot mathematical challenge with stateless HMAC token
   */
  static generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1; // 1 - 10
    const num2 = Math.floor(Math.random() * 10) + 1; // 1 - 10
    const answer = String(num1 + num2);
    const timestamp = Date.now();
    const secret = env.JWT_SECRET || 'lingua-captcha-secret-key';

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(`${answer}:${timestamp}`)
      .digest('hex');

    const token = `${timestamp}:${hmac}`;

    return {
      challenge: `Security Check: What is ${num1} + ${num2}?`,
      token,
    };
  }

  /**
   * Verify an anti-bot challenge response against its HMAC token
   */
  static verifyCaptcha(userAnswer, token) {
    if (!userAnswer || !token) return false;
    const parts = String(token).split(':');
    if (parts.length !== 2) return false;

    const [timestampStr, expectedHmac] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Challenge expires after 15 minutes
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      return false;
    }

    const secret = env.JWT_SECRET || 'lingua-captcha-secret-key';
    const computedHmac = crypto
      .createHmac('sha256', secret)
      .update(`${String(userAnswer).trim()}:${timestamp}`)
      .digest('hex');

    if (expectedHmac.length !== computedHmac.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(computedHmac));
  }

  /**
   * Get public diagnostic questions directly from database.
   * If active placement tests exist, picks one at random and randomizes questions,
   * with zero batch title leaked to public test takers.
   */
  static async getPublicQuestions() {
    // 1. Check if active placement tests exist with questions
    const placementTestRes = await query(
      `SELECT pt.id, pt.title, pt.description
       FROM "public"."placement_tests" pt
       WHERE pt."isActive" = true 
         AND (SELECT COUNT(*) FROM "public"."placement_questions" pq WHERE pq."placementTestId" = pt.id) > 0
       ORDER BY RANDOM() LIMIT 1`
    );

    if (placementTestRes.rows.length > 0) {
      const placement = placementTestRes.rows[0];
      const qRes = await query(
        `SELECT id, "placementTestId", level AS difficulty, skill, 'General Assessment' AS category, prompt, options, "orderIndex"
         FROM "public"."placement_questions"
         WHERE "placementTestId" = $1
         ORDER BY RANDOM()`,
        [placement.id]
      );

      if (qRes.rows.length > 0) {
        return qRes.rows.map((row) => ({
          id: row.id,
          placementTestId: row.placementTestId,
          category: row.category,
          skill: row.skill,
          difficulty: row.difficulty,
          prompt: row.prompt,
          options: parsePgArray(row.options),
          orderIndex: row.orderIndex,
        }));
      }
    }

    // 2. Fallback to active diagnostic_questions in database
    const res = await query(
      `SELECT "id", "category", "skill", "difficulty", "prompt", "audioText", "options", "orderIndex"
       FROM "public"."diagnostic_questions"
       WHERE "isActive" = true
       ORDER BY RANDOM()`
    );

    return res.rows.map((row) => ({
      ...row,
      options: parsePgArray(row.options),
    }));
  }

  /**
   * Get single question by ID
   */
  static async getQuestionById(id) {
    const res = await query(
      `SELECT * FROM "public"."diagnostic_questions" WHERE "id" = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      options: parsePgArray(row.options),
    };
  }

  /**
   * Create a single diagnostic question
   */
  static async createQuestion({
    category,
    skill,
    difficulty = 'B1',
    prompt,
    audioText = null,
    options = [],
    correctAnswer,
    explanation = null,
    orderIndex = 1,
    isActive = true,
  }) {
    const id = crypto.randomUUID();
    const optionsArray = Array.isArray(options) ? options : [];

    const res = await query(
      `INSERT INTO "public"."diagnostic_questions"
        ("id", "category", "skill", "difficulty", "prompt", "audioText", "options", "correctAnswer", "explanation", "orderIndex", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        id,
        category || 'General Assessment',
        skill || 'Grammar',
        difficulty,
        prompt,
        audioText || null,
        optionsArray,
        correctAnswer,
        explanation || null,
        Number(orderIndex) || 1,
        Boolean(isActive),
      ]
    );

    return {
      ...res.rows[0],
      options: parsePgArray(res.rows[0].options),
    };
  }

  /**
   * Bulk create questions in a managed transaction
   */
  static async bulkCreateQuestions(questions = [], replaceExisting = false) {
    return await transaction(async (client) => {
      if (replaceExisting) {
        await client.query(`DELETE FROM "public"."diagnostic_questions"`);
      }

      const created = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const id = crypto.randomUUID();
        const optionsArray = Array.isArray(q.options) ? q.options : [];

        const res = await client.query(
          `INSERT INTO "public"."diagnostic_questions"
            ("id", "category", "skill", "difficulty", "prompt", "audioText", "options", "correctAnswer", "explanation", "orderIndex", "isActive", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
           RETURNING *`,
          [
            id,
            q.category || 'General Assessment',
            q.skill || 'Grammar',
            q.difficulty || 'B1',
            q.prompt,
            q.audioText || null,
            optionsArray,
            q.correctAnswer,
            q.explanation || null,
            Number(q.orderIndex) || i + 1,
            q.isActive !== undefined ? Boolean(q.isActive) : true,
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
   * Update an existing diagnostic question
   */
  static async updateQuestion(id, {
    category,
    skill,
    difficulty,
    prompt,
    audioText,
    options,
    correctAnswer,
    explanation,
    orderIndex,
    isActive,
  }) {
    const existing = await this.getQuestionById(id);
    if (!existing) {
      throw new Error(`Diagnostic question with ID "${id}" not found.`);
    }

    const optionsArray = Array.isArray(options) ? options : existing.options;

    const res = await query(
      `UPDATE "public"."diagnostic_questions"
       SET "category" = COALESCE($1, "category"),
           "skill" = COALESCE($2, "skill"),
           "difficulty" = COALESCE($3, "difficulty"),
           "prompt" = COALESCE($4, "prompt"),
           "audioText" = $5,
           "options" = COALESCE($6, "options"),
           "correctAnswer" = COALESCE($7, "correctAnswer"),
           "explanation" = $8,
           "orderIndex" = COALESCE($9, "orderIndex"),
           "isActive" = COALESCE($10, "isActive"),
           "updatedAt" = NOW()
       WHERE "id" = $11
       RETURNING *`,
      [
        category,
        skill,
        difficulty,
        prompt,
        audioText !== undefined ? audioText : existing.audioText,
        optionsArray,
        correctAnswer,
        explanation !== undefined ? explanation : existing.explanation,
        orderIndex !== undefined ? Number(orderIndex) : existing.orderIndex,
        isActive !== undefined ? Boolean(isActive) : existing.isActive,
        id,
      ]
    );

    return {
      ...res.rows[0],
      options: parsePgArray(res.rows[0].options),
    };
  }

  /**
   * Delete a diagnostic question
   */
  static async deleteQuestion(id) {
    const res = await query(
      `DELETE FROM "public"."diagnostic_questions" WHERE "id" = $1 RETURNING *`,
      [id]
    );
    if (res.rows.length === 0) {
      throw new Error(`Diagnostic question with ID "${id}" not found.`);
    }
    return res.rows[0];
  }

  /**
   * Get Diagnostic Analytics for Teacher Dashboard
   */
  static async getAnalytics() {
    // 1. Total counts & aggregates
    const statsRes = await query(`
      SELECT 
        COUNT(DISTINCT "ipAddress") AS "uniqueIps",
        COUNT(DISTINCT "userId") AS "uniqueUsers",
        COUNT(*) AS "totalAttempts",
        COALESCE(ROUND(AVG("percentage")::numeric, 1), 0) AS "globalAvgScore"
      FROM "public"."diagnostic_attempts"
    `);

    const qCountRes = await query(`
      SELECT COUNT(*) AS "totalQuestionsCount"
      FROM "public"."diagnostic_questions"
      WHERE "isActive" = true
    `);

    const stats = statsRes.rows[0];
    const totalQuestionsCount = parseInt(qCountRes.rows[0]?.totalQuestionsCount || 0, 10);
    const totalAttempts = parseInt(stats.totalAttempts || 0, 10);
    const totalUniqueParticipants = Math.max(
      parseInt(stats.uniqueIps || 0, 10),
      parseInt(stats.uniqueUsers || 0, 10)
    );
    const globalAverageScore = Number(stats.globalAvgScore || 0);

    // 2. Average Score by Try Number (Try #1, Try #2, Try #3, Try #4+)
    const tryRes = await query(`
      SELECT 
        CASE 
          WHEN "attemptNumber" = 1 THEN 'Try #1 (Initial Assessment)'
          WHEN "attemptNumber" = 2 THEN 'Try #2 (Second Attempt)'
          WHEN "attemptNumber" = 3 THEN 'Try #3 (Third Attempt)'
          ELSE 'Try #4+ (Repeated Practice)'
        END AS "tryLabel",
        CASE 
          WHEN "attemptNumber" >= 4 THEN 4
          ELSE "attemptNumber"
        END AS "tryNumber",
        COUNT(*) AS "attemptsCount",
        ROUND(AVG("percentage")::numeric, 1) AS "avgPercentage",
        ROUND(AVG("score")::numeric, 1) AS "avgScore"
      FROM "public"."diagnostic_attempts"
      GROUP BY 
        CASE 
          WHEN "attemptNumber" = 1 THEN 'Try #1 (Initial Assessment)'
          WHEN "attemptNumber" = 2 THEN 'Try #2 (Second Attempt)'
          WHEN "attemptNumber" = 3 THEN 'Try #3 (Third Attempt)'
          ELSE 'Try #4+ (Repeated Practice)'
        END,
        CASE 
          WHEN "attemptNumber" >= 4 THEN 4
          ELSE "attemptNumber"
        END
      ORDER BY "tryNumber" ASC
    `);

    // Ensure standard 4 try buckets even if DB is fresh
    const standardTries = [
      { tryNumber: 1, tryLabel: 'Try #1 (Initial Assessment)', attemptsCount: 0, avgPercentage: 0, avgScore: 0 },
      { tryNumber: 2, tryLabel: 'Try #2 (Second Attempt)', attemptsCount: 0, avgPercentage: 0, avgScore: 0 },
      { tryNumber: 3, tryLabel: 'Try #3 (Third Attempt)', attemptsCount: 0, avgPercentage: 0, avgScore: 0 },
      { tryNumber: 4, tryLabel: 'Try #4+ (Repeated Practice)', attemptsCount: 0, avgPercentage: 0, avgScore: 0 },
    ];

    const averageScoreByTry = standardTries.map((std) => {
      const found = tryRes.rows.find((r) => Number(r.tryNumber) === std.tryNumber);
      if (found) {
        return {
          tryLabel: found.tryLabel,
          tryNumber: Number(found.tryNumber),
          attemptsCount: parseInt(found.attemptsCount, 10),
          avgPercentage: Number(found.avgPercentage),
          avgScore: Number(found.avgScore),
        };
      }
      return std;
    });

    // 3. Level Distribution
    const levelRes = await query(`
      SELECT "recommendedLevel", COUNT(*) AS "count"
      FROM "public"."diagnostic_attempts"
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
        da.*,
        u."firstName",
        u."lastName",
        u."email",
        u."avatarUrl"
      FROM "public"."diagnostic_attempts" da
      LEFT JOIN "public"."users" u ON u."id" = da."userId"
      ORDER BY da."createdAt" DESC
      LIMIT 50
    `);

    const recentAttempts = recentRes.rows.map((row) => ({
      id: row.id,
      ipAddress: row.ipAddress,
      userId: row.userId,
      user: row.userId
        ? {
            firstName: row.firstName || 'Candidate',
            lastName: row.lastName || '',
            email: row.email || '',
            avatarUrl: row.avatarUrl || null,
          }
        : null,
      attemptNumber: row.attemptNumber,
      score: row.score,
      totalQuestions: row.totalQuestions,
      percentage: Number(row.percentage),
      recommendedLevel: row.recommendedLevel,
      answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers || [],
      createdAt: row.createdAt,
    }));

    return {
      totalUniqueParticipants,
      totalAttempts,
      globalAverageScore,
      totalQuestionsCount,
      averageScoreByTry,
      levelDistribution,
      recentAttempts,
    };
  }

  /**
   * Grade and submit candidate attempt (public intake / test completion)
   * Captures IP, User-Agent, Captcha verification status, and saves complete evaluation to DB.
   */
  static async submitAttempt({
    answers = [],
    ipAddress = '127.0.0.1',
    userAgent = null,
    captchaAnswer = null,
    captchaToken = null,
    placementTestId = null,
    userId = null,
  }) {
    // 1. Verify CAPTCHA if provided
    let captchaVerified = true;
    if (captchaToken) {
      captchaVerified = this.verifyCaptcha(captchaAnswer, captchaToken);
      if (!captchaVerified) {
        throw new Error('Security CAPTCHA verification failed. Please check your answer and try again.');
      }
    }

    // 2. Fetch assessment questions directly from DB (placement_questions or diagnostic_questions)
    let questions = [];

    if (placementTestId) {
      const pQRes = await query(
        `SELECT id, "placementTestId", level AS difficulty, skill, 'General Assessment' AS category, prompt, options, "correctAnswer", "orderIndex"
         FROM "public"."placement_questions"
         WHERE "placementTestId" = $1
         ORDER BY "orderIndex" ASC`,
        [placementTestId]
      );
      questions = pQRes.rows.map((q) => ({
        ...q,
        options: parsePgArray(q.options),
      }));
    }

    if (questions.length === 0 && answers.length > 0) {
      // Check if answers contain question IDs from placement_questions
      const sampleId = answers[0]?.questionId;
      if (sampleId) {
        const checkPQ = await query(
          `SELECT "placementTestId" FROM "public"."placement_questions" WHERE id = $1 LIMIT 1`,
          [sampleId]
        );
        if (checkPQ.rows.length > 0) {
          placementTestId = checkPQ.rows[0].placementTestId;
          const pQRes = await query(
            `SELECT id, "placementTestId", level AS difficulty, skill, 'General Assessment' AS category, prompt, options, "correctAnswer", "orderIndex"
             FROM "public"."placement_questions"
             WHERE "placementTestId" = $1
             ORDER BY "orderIndex" ASC`,
            [placementTestId]
          );
          questions = pQRes.rows.map((q) => ({
            ...q,
            options: parsePgArray(q.options),
          }));
        }
      }
    }

    if (questions.length === 0) {
      const qRes = await query(
        `SELECT * FROM "public"."diagnostic_questions" WHERE "isActive" = true ORDER BY "orderIndex" ASC`
      );
      questions = qRes.rows.map((q) => ({
        ...q,
        options: parsePgArray(q.options),
      }));
    }

    if (questions.length === 0) {
      throw new Error('No active assessment questions are currently available in the database.');
    }

    // 3. Grade each answered question
    let score = 0;
    const review = [];

    for (const q of questions) {
      const candidateAns = answers.find(
        (a) => a.questionId === q.id || String(a.questionId) === String(q.id)
      );

      let selectedText = '';
      if (candidateAns) {
        if (typeof candidateAns.selectedOption === 'number' && q.options[candidateAns.selectedOption]) {
          selectedText = q.options[candidateAns.selectedOption];
        } else if (candidateAns.selectedAnswer) {
          selectedText = String(candidateAns.selectedAnswer).trim();
        }
      }

      const isCorrect =
        selectedText.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();

      if (isCorrect) {
        score += 1;
      }

      review.push({
        questionId: q.id,
        prompt: q.prompt,
        category: q.category || 'General Assessment',
        skill: q.skill || 'GRAMMAR',
        difficulty: q.difficulty || q.level || 'B1',
        selectedAnswer: selectedText,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
      });
    }

    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    // 4. Determine CEFR Recommended Level
    let recommendedLevel = 'A1';
    if (percentage >= 90) recommendedLevel = 'C2';
    else if (percentage >= 80) recommendedLevel = 'C1';
    else if (percentage >= 65) recommendedLevel = 'B2';
    else if (percentage >= 50) recommendedLevel = 'B1';
    else if (percentage >= 35) recommendedLevel = 'A2';
    else if (percentage >= 20) recommendedLevel = 'A1';
    else recommendedLevel = 'PRE_A1';

    // 5. Calculate attempt number for this IP / User
    const prevAttemptsRes = await query(
      `SELECT COUNT(*) AS "count" 
       FROM "public"."diagnostic_attempts" 
       WHERE "ipAddress" = $1 OR ($2::text IS NOT NULL AND "userId" = $2)`,
      [ipAddress, userId]
    );
    const attemptNumber = parseInt(prevAttemptsRes.rows[0]?.count || 0, 10) + 1;

    // 6. Insert full attempt record with IP and device metadata into diagnostic_attempts
    const attemptId = crypto.randomUUID();
    await query(
      `INSERT INTO "public"."diagnostic_attempts"
        ("id", "ipAddress", "userAgent", "captchaVerified", "userId", "attemptNumber", "score", "totalQuestions", "percentage", "recommendedLevel", "answers", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        attemptId,
        ipAddress,
        userAgent,
        captchaVerified,
        userId,
        attemptNumber,
        score,
        totalQuestions,
        percentage,
        recommendedLevel,
        JSON.stringify(review),
      ]
    );

    // If this attempt originated from a placement test, also record into placement_attempts!
    if (placementTestId) {
      const pAttemptId = crypto.randomUUID();
      await query(
        `INSERT INTO "public"."placement_attempts"
          (id, "placementTestId", "studentId", score, "recommendedLevel", answers, "ipAddress", "userAgent", "captchaVerified", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          pAttemptId,
          placementTestId,
          userId,
          percentage,
          recommendedLevel,
          JSON.stringify(review),
          ipAddress,
          userAgent,
          captchaVerified,
        ]
      );
    }

    // 7. Find recommended course for this level from DB
    const courseRes = await query(
      `SELECT c.id, c.title, c.slug, c.level, c.currency, c.description,
              u."firstName", u."lastName"
       FROM "public"."courses" c
       LEFT JOIN "public"."users" u ON u.id = c."teacherId"
       WHERE c.level::text = $1 AND c."isPublished" = true
       LIMIT 1`,
      [recommendedLevel]
    );

    let recommendedCourse = null;
    if (courseRes.rows.length > 0) {
      const crs = courseRes.rows[0];
      recommendedCourse = {
        id: crs.id,
        title: crs.title,
        slug: crs.slug,
        level: crs.level,
        price: Number(crs.price || 0),
        currency: crs.currency || 'USD',
        description: crs.description,
        instructorName: crs.firstName ? `${crs.firstName} ${crs.lastName || ''}`.trim() : 'Lingua Master Instructor',
      };
    }

    return {
      attemptId,
      attemptNumber,
      score,
      totalQuestions,
      percentage,
      recommendedLevel,
      ipAddress,
      userAgent,
      captchaVerified,
      recommendedCourse,
      review,
    };
  }
}
