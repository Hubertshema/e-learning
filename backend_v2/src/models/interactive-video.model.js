import crypto from 'crypto';
import { query } from '../config/database.js';
import { AIService } from '../services/ai.service.js';

const allowedTypes = new Set([
  'MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'FILL_BLANK',
  'SHORT_ANSWER', 'MATCHING', 'ORDERING', 'DRAG_DROP', 'IMAGE',
  'SPEAKING', 'LISTENING', 'VOCABULARY', 'GRAMMAR', 'READING', 'WRITING',
]);

function id() { return crypto.randomUUID(); }

export class InteractiveVideoModel {
  static async isTeacherOwner(lessonId, userId) {
    const result = await query(
      `SELECT 1 FROM "lessons" l JOIN "units" u ON u.id = l."unitId"
       JOIN "courses" c ON c.id = u."courseId"
       WHERE l.id = $1 AND (c."teacherId" = $2 OR c."teacherId" IN
       (SELECT id FROM "teacher_profiles" WHERE "userId" = $2))`,
      [lessonId, userId]
    );
    return result.rowCount > 0;
  }

  static async hasStudentAccess(lessonId, userId, role = 'STUDENT') {
    if (role === 'SUPERADMIN') {
      const result = await query(
        `SELECT ivl.* FROM "interactive_video_lessons" ivl WHERE ivl."lessonId" = $1`,
        [lessonId]
      );
      if (result.rows[0]) return result.rows[0];
      const l = await query(`SELECT id FROM "lessons" WHERE id = $1`, [lessonId]);
      return l.rowCount ? { lessonId, status: 'DRAFT' } : null;
    }

    if (role === 'TEACHER') {
      const isOwner = await this.isTeacherOwner(lessonId, userId);
      if (isOwner) {
        const result = await query(
          `SELECT ivl.* FROM "interactive_video_lessons" ivl WHERE ivl."lessonId" = $1`,
          [lessonId]
        );
        if (result.rows[0]) return result.rows[0];
        const l = await query(`SELECT id FROM "lessons" WHERE id = $1`, [lessonId]);
        return l.rowCount ? { lessonId, status: 'DRAFT' } : null;
      }
    }

    const result = await query(
      `SELECT ivl.* FROM "interactive_video_lessons" ivl
       JOIN "lessons" l ON l.id = ivl."lessonId"
       JOIN "units" u ON u.id = l."unitId"
       JOIN "courses" c ON c.id = u."courseId"
       JOIN "enrollments" e ON e."courseId" = c.id AND e."studentId" = $2
       WHERE ivl."lessonId" = $1 AND ivl.status = 'PUBLISHED'
         AND COALESCE(e.status, 'ACTIVE') NOT IN ('CANCELLED','EXPIRED')`,
      [lessonId, userId]
    );
    return result.rows[0] || null;
  }

  static async getForTeacher(lessonId, teacherId) {
    if (!(await this.isTeacherOwner(lessonId, teacherId))) return null;
    return this.getFull(lessonId, false);
  }

  static async getForStudent(lessonId, studentId, role = 'STUDENT') {
    const video = await this.hasStudentAccess(lessonId, studentId, role);
    if (!video) return null;
    return this.getFull(lessonId, true, studentId);
  }

  static async getFull(lessonId, includePrivate, studentId) {
    const videoRes = await query(`SELECT ivl.*, l.title AS "lessonTitle"
      FROM "interactive_video_lessons" ivl JOIN "lessons" l ON l.id = ivl."lessonId"
      WHERE ivl."lessonId" = $1`, [lessonId]);
    if (!videoRes.rows[0]) {
      const lessonRes = await query(`SELECT l.id AS "lessonId", l.title AS "lessonTitle" FROM "lessons" l WHERE l.id = $1`, [lessonId]);
      if (!lessonRes.rows[0]) return null;
      return {
        lessonId,
        lessonTitle: lessonRes.rows[0].lessonTitle,
        videoUrl: '',
        thumbnailUrl: null,
        durationSeconds: 0,
        navigationMode: 'FREE',
        transcript: [],
        captions: [],
        status: 'DRAFT',
        activities: [],
        resources: [],
        progress: null,
      };
    }
    const video = videoRes.rows[0];
    const [activities, resources, progress, completedAttempts] = await Promise.all([
      query(`SELECT * FROM "interactive_video_activities" WHERE "lessonId" = $1
             ORDER BY "timestampSeconds", "orderIndex"`, [lessonId]),
      query(`SELECT id, title, description, url, "resourceType", "canView", "canDownload", "orderIndex"
             FROM "interactive_video_resources" WHERE "lessonId" = $1 AND "canView" = true
             ORDER BY "orderIndex"`, [lessonId]),
      studentId ? query(`SELECT * FROM "interactive_video_progress"
             WHERE "lessonId" = $1 AND "studentId" = $2`, [lessonId, studentId]) : Promise.resolve({ rows: [] }),
      studentId ? query(`SELECT DISTINCT a.id AS "activityId" FROM "interactive_video_activities" a
             JOIN "interactive_video_attempts" att ON att."activityId" = a.id
             WHERE a."lessonId" = $1 AND att."studentId" = $2 AND (att."isCorrect" = true OR a."allowRetry" = false)`, [lessonId, studentId]) : Promise.resolve({ rows: [] }),
    ]);
    const completedActivityIds = (completedAttempts.rows || []).map(r => r.activityId);
    return {
      ...video,
      ...(includePrivate ? {} : { createdBy: video.createdBy }),
      activities: activities.rows,
      resources: resources.rows,
      progress: progress.rows[0] || null,
      completedActivityIds,
    };
  }

  static validatePayload(body) {
    if (!body.videoUrl || typeof body.videoUrl !== 'string' || body.videoUrl.length > 2000) {
      throw Object.assign(new Error('A valid video URL is required'), { status: 400, code: 'VALIDATION_ERROR' });
    }
    if (body.durationSeconds != null && (!Number.isInteger(Number(body.durationSeconds)) || Number(body.durationSeconds) < 0)) {
      throw Object.assign(new Error('Duration must be a non-negative integer'), { status: 400, code: 'VALIDATION_ERROR' });
    }
  }

  static async upsert(lessonId, teacherId, body) {
    if (!(await this.isTeacherOwner(lessonId, teacherId))) return null;
    this.validatePayload(body);
    const existing = await query(`SELECT "lessonId" FROM "interactive_video_lessons" WHERE "lessonId" = $1`, [lessonId]);
    const fields = [body.videoUrl, body.thumbnailUrl || null, Number(body.durationSeconds || 0),
      body.cefrLevel || null, body.skill || 'LISTENING', JSON.stringify(body.transcript || []),
      JSON.stringify(body.captions || []), body.navigationMode || 'FREE',
      body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT', teacherId, lessonId];
    if (existing.rowCount) {
      await query(`UPDATE "interactive_video_lessons" SET "videoUrl"=$1,"thumbnailUrl"=$2,
        "durationSeconds"=$3,"cefrLevel"=$4,"skill"=$5,"transcript"=$6,"captions"=$7,
        "navigationMode"=$8,"status"=$9,"updatedAt"=NOW() WHERE "lessonId"=$10`, fields.slice(0, 9).concat(lessonId));
    } else {
      await query(`INSERT INTO "interactive_video_lessons"
        ("lessonId","videoUrl","thumbnailUrl","durationSeconds","cefrLevel","skill","transcript","captions","navigationMode","status","createdBy")
        VALUES ($11,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, fields);
    }
    return this.getForTeacher(lessonId, teacherId);
  }

  static async saveActivity(lessonId, teacherId, activity) {
    if (!(await this.isTeacherOwner(lessonId, teacherId))) return null;
    const type = activity.type === 'FILL_IN_BLANK' ? 'FILL_BLANK' : activity.type;
    if (!allowedTypes.has(type) || !activity.title || Number(activity.timestampSeconds) < 0) {
      throw Object.assign(new Error('Activity type, title and timestamp are required'), { status: 400, code: 'VALIDATION_ERROR' });
    }
    const activityId = activity.id || id();
    const values = [activityId, lessonId, Number(activity.timestampSeconds), type, activity.title,
      activity.instructions || null, JSON.stringify(activity.content || {}), Number(activity.points || 1),
      activity.required !== false, activity.feedback || null, activity.explanation || null,
      Number(activity.orderIndex || 0), Number(activity.maxAttempts || 0), activity.allowRetry !== false];
    await query(`INSERT INTO "interactive_video_activities"
      (id,"lessonId","timestampSeconds",type,title,instructions,content,points,required,feedback,explanation,"orderIndex","maxAttempts","allowRetry")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (id) DO UPDATE SET "timestampSeconds"=$3,type=$4,title=$5,instructions=$6,content=$7,points=$8,
      required=$9,feedback=$10,explanation=$11,"orderIndex"=$12,"maxAttempts"=$13,"allowRetry"=$14,"updatedAt"=NOW()`, values);
    return (await query(`SELECT * FROM "interactive_video_activities" WHERE id=$1`, [activityId])).rows[0];
  }

  static async deleteActivity(activityId, teacherId) {
    const owner = await query(`SELECT a.id FROM "interactive_video_activities" a
      WHERE a.id=$1 AND EXISTS (SELECT 1 FROM "lessons" l JOIN "units" u ON u.id=l."unitId"
      JOIN "courses" c ON c.id=u."courseId" WHERE l.id=a."lessonId" AND
      (c."teacherId"=$2 OR c."teacherId" IN (SELECT id FROM "teacher_profiles" WHERE "userId"=$2)))`, [activityId, teacherId]);
    if (!owner.rowCount) return false;
    await query(`DELETE FROM "interactive_video_activities" WHERE id=$1`, [activityId]);
    return true;
  }

  static async addResource(lessonId, teacherId, resource) {
    if (!(await this.isTeacherOwner(lessonId, teacherId)) || !resource.title || !resource.url) return null;
    const result = await query(`INSERT INTO "interactive_video_resources"
      (id,"lessonId",title,description,url,"resourceType","canView","canDownload","orderIndex")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id(), lessonId, resource.title.trim(), resource.description || null, resource.url,
        resource.resourceType || 'LINK', resource.canView !== false, resource.canDownload === true,
        Number(resource.orderIndex || 0)]);
    return result.rows[0];
  }

  static async analytics(lessonId, teacherId) {
    if (!(await this.isTeacherOwner(lessonId, teacherId))) return null;
    const result = await query(`SELECT
      COUNT(DISTINCT p."studentId")::int AS "studentsStarted",
      COUNT(DISTINCT p."studentId") FILTER (WHERE p."completedAt" IS NOT NULL)::int AS "completed",
      ROUND(AVG(p."completionPercent"), 1) AS "averageCompletion",
      ROUND(AVG(a.score), 1) AS "averageScore",
      COUNT(a.id)::int AS "attempts"
      FROM "interactive_video_progress" p
      LEFT JOIN "interactive_video_attempts" a ON a."studentId"=p."studentId"
      WHERE p."lessonId"=$1`, [lessonId]);
    return result.rows[0];
  }

  static async submitAttempt(activityId, studentId, answer, role = 'STUDENT') {
    const activity = await query(`SELECT a.*, ivl."lessonId" FROM "interactive_video_activities" a
      JOIN "interactive_video_lessons" ivl ON ivl."lessonId"=a."lessonId" WHERE a.id=$1`, [activityId]);
    if (!activity.rows[0] || !(await this.hasStudentAccess(activity.rows[0].lessonId, studentId, role))) return null;
    const a = activity.rows[0];
    const content = a.content || {};
    const normalized = (value) => String(value ?? '').trim().toLowerCase();

    let correct = false;
    let expectedAnswer = null;

    if (['MULTIPLE_CHOICE', 'IMAGE', 'LISTENING', 'GRAMMAR', 'READING', 'VOCABULARY'].includes(a.type)) {
      if (Array.isArray(content.options) && content.options.length > 0) {
        const correctOpt = content.options.find((o) => o && (o.isCorrect === true || o.correct === true));
        if (correctOpt) {
          expectedAnswer = typeof correctOpt === 'string' ? correctOpt : (correctOpt.text || correctOpt.label || '');
        } else if (content.correctIndex !== undefined && content.options[content.correctIndex]) {
          const opt = content.options[content.correctIndex];
          expectedAnswer = typeof opt === 'string' ? opt : (opt.text || opt.label || '');
        }
      }
      if (!expectedAnswer && content.correctAnswer) {
        expectedAnswer = content.correctAnswer;
      }
      correct = expectedAnswer ? normalized(answer) === normalized(expectedAnswer) : false;
    } else if (a.type === 'MULTIPLE_SELECT') {
      let expectedList = [];
      if (Array.isArray(content.options) && content.options.some((o) => o && o.isCorrect)) {
        expectedList = content.options
          .filter((o) => o && o.isCorrect)
          .map((o) => (typeof o === 'string' ? o : o.text || o.label || ''));
      } else if (Array.isArray(content.correctAnswers)) {
        expectedList = content.correctAnswers;
      }
      expectedAnswer = expectedList;
      const studentList = Array.isArray(answer) ? answer.map(normalized) : [normalized(answer)];
      const targetNormalized = expectedList.map(normalized);
      correct =
        targetNormalized.length > 0 &&
        studentList.length === targetNormalized.length &&
        studentList.every((s) => targetNormalized.includes(s));
    } else if (a.type === 'TRUE_FALSE') {
      expectedAnswer = String(content.correctAnswer ?? 'true').toLowerCase();
      correct = normalized(answer) === normalized(expectedAnswer);
    } else if (a.type === 'FILL_BLANK' || a.type === 'FILL_IN_BLANK') {
      expectedAnswer = content.expectedText || content.correctAnswer || '';
      const acceptable = [];
      if (expectedAnswer) acceptable.push(expectedAnswer);
      if (Array.isArray(content.acceptableAnswers)) {
        acceptable.push(...content.acceptableAnswers);
      } else if (typeof content.acceptableAnswers === 'string') {
        acceptable.push(...content.acceptableAnswers.split(',').map((s) => s.trim()).filter(Boolean));
      }
      correct = acceptable.some((x) => normalized(x) === normalized(answer));
      if (!expectedAnswer && acceptable.length > 0) expectedAnswer = acceptable[0];
    } else if (a.type === 'DRAG_DROP') {
      expectedAnswer = content.correctSentence || content.correctAnswer || '';
      const submittedSentence = Array.isArray(answer) ? answer.join(' ') : String(answer ?? '');
      correct = normalized(submittedSentence) === normalized(expectedAnswer);
    } else if (a.type === 'ORDERING') {
      expectedAnswer = content.items || content.correctOrder || [];
      correct = JSON.stringify(answer || []) === JSON.stringify(expectedAnswer || []);
    } else if (a.type === 'MATCHING') {
      expectedAnswer = {};
      if (Array.isArray(content.pairs)) {
        content.pairs.forEach((p) => {
          if (p && p.left) expectedAnswer[p.left] = p.right;
        });
      } else if (content.pairs && typeof content.pairs === 'object') {
        expectedAnswer = content.pairs;
      }
      correct = JSON.stringify(answer || {}) === JSON.stringify(expectedAnswer);
    } else if (a.type === 'SHORT_ANSWER') {
      expectedAnswer = content.expectedAnswer || content.correctAnswer || '';
      const keywords =
        typeof content.keywords === 'string'
          ? content.keywords.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
          : Array.isArray(content.keywords)
          ? content.keywords.map((s) => String(s).trim().toLowerCase())
          : [];
      if (expectedAnswer && normalized(answer) === normalized(expectedAnswer)) {
        correct = true;
      } else if (keywords.length > 0 && keywords.some((k) => normalized(answer).includes(k))) {
        correct = true;
      } else if (!expectedAnswer && keywords.length === 0 && String(answer || '').trim().length > 0) {
        correct = true;
      }
    } else if (['SPEAKING', 'WRITING', 'POLL', 'NOTE', 'DISCUSSION', 'SURVEY'].includes(a.type)) {
      expectedAnswer = content.targetSentence || content.prompt || 'Completed response';
      correct = String(answer ?? '').trim().length > 0;
    } else {
      expectedAnswer = content.correctAnswer || content.expectedAnswer || content.expectedText || '';
      correct = expectedAnswer ? normalized(answer) === normalized(expectedAnswer) : String(answer || '').trim().length > 0;
    }

    const count = await query(
      `SELECT COUNT(*)::int AS count FROM "interactive_video_attempts" WHERE "activityId"=$1 AND "studentId"=$2`,
      [activityId, studentId]
    );
    const score = correct ? Number(a.points) : 0;
    const feedbackText = correct
      ? 'Correct — well done!'
      : (a.feedback || 'Incorrect. Review the correct answer and explanation to learn more.');

    const result = await query(
      `INSERT INTO "interactive_video_attempts"
      (id,"activityId","studentId",answer,"isCorrect",score,feedback,"attemptNumber")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        id(),
        activityId,
        studentId,
        JSON.stringify(answer),
        correct,
        score,
        feedbackText,
        count.rows[0].count + 1,
      ]
    );
    return {
      ...result.rows[0],
      isCorrect: correct,
      explanation: a.explanation,
      correctAnswer: expectedAnswer,
    };
  }

  static async saveProgress(lessonId, studentId, body, role = 'STUDENT') {
    if (!(await this.hasStudentAccess(lessonId, studentId, role))) return null;
    const position = Math.max(0, Number(body.lastPositionSeconds || 0));
    const watched = Math.max(0, Number(body.watchedSeconds || 0));
    const percent = Math.min(100, Math.max(0, Number(body.completionPercent || 0)));
    const result = await query(`INSERT INTO "interactive_video_progress"
      (id,"lessonId","studentId","lastPositionSeconds","watchedSeconds","completionPercent","completedAt")
      VALUES ($1,$2,$3,$4,$5,$6,CASE WHEN $6 >= 95 THEN NOW() ELSE NULL END)
      ON CONFLICT ("lessonId","studentId") DO UPDATE SET "lastPositionSeconds"=$4,
      "watchedSeconds"=GREATEST("interactive_video_progress"."watchedSeconds",$5),
      "completionPercent"=GREATEST("interactive_video_progress"."completionPercent",$6),
      "completedAt"=CASE WHEN $6 >= 95 THEN NOW() ELSE "interactive_video_progress"."completedAt" END,"updatedAt"=NOW()
      RETURNING *`, [id(), lessonId, studentId, position, watched, percent]);
    return result.rows[0];
  }

  static async generateActivities(lessonId, teacherId, { density = 'medium', targetLevel = 'B1' }) {
    if (!(await this.isTeacherOwner(lessonId, teacherId))) return null;
    const lesson = await query(`SELECT l.title, ivl.transcript, ivl.skill FROM "interactive_video_lessons" ivl
      JOIN "lessons" l ON l.id = ivl."lessonId" WHERE ivl."lessonId"=$1`, [lessonId]);
    if (!lesson.rows[0]) return null;

    const transcriptText = Array.isArray(lesson.rows[0].transcript) 
      ? lesson.rows[0].transcript.map(t => t.text).join(' ') 
      : String(lesson.rows[0].transcript || '');

    const count = density === 'high' ? 8 : density === 'low' ? 3 : 5;
    const systemPrompt = `You are an expert curriculum designer. Given the following video transcript, generate ${count} interactive activities for ${targetLevel} level students. Focus on ${lesson.rows[0].skill} skills.
    Return ONLY a valid JSON array of objects with this schema:
    [
      {
        "type": "MULTIPLE_CHOICE",
        "title": "Clear question based on the transcript",
        "timestampSeconds": 30,
        "content": {
          "options": [
            {"text": "Correct Option", "isCorrect": true},
            {"text": "Wrong Option", "isCorrect": false}
          ]
        },
        "points": 10
      }
    ]
    Include plausible timestamps if the transcript doesn't explicitly have them. Ensure no markdown formatting.`;
    
    const userPrompt = `Transcript:\n\n${transcriptText.slice(0, 8000) || '(No transcript provided)'}`;
    
    try {
      const rawJson = await AIService.callAI({ systemPrompt, userPrompt, temperature: 0.7, maxTokens: 2000 });
      let result = [];
      try {
        const text = rawJson?.text || rawJson;
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        result = JSON.parse(cleaned);
      } catch (e) {
        console.error('Failed to parse AI activities', e);
      }
      return result;
    } catch (e) {
      console.error('AI generation failed', e);
      return [];
    }
  }
}
