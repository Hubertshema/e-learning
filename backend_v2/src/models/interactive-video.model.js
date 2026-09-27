import crypto from 'crypto';
import { query } from '../config/database.js';

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

  static async hasStudentAccess(lessonId, studentId) {
    const result = await query(
      `SELECT ivl.* FROM "interactive_video_lessons" ivl
       JOIN "lessons" l ON l.id = ivl."lessonId"
       JOIN "units" u ON u.id = l."unitId"
       JOIN "courses" c ON c.id = u."courseId"
       JOIN "enrollments" e ON e."courseId" = c.id AND e."studentId" = $2
       WHERE ivl."lessonId" = $1 AND ivl.status = 'PUBLISHED'
         AND COALESCE(e.status, 'ACTIVE') NOT IN ('CANCELLED','EXPIRED')`,
      [lessonId, studentId]
    );
    return result.rows[0] || null;
  }

  static async getForTeacher(lessonId, teacherId) {
    if (!(await this.isTeacherOwner(lessonId, teacherId))) return null;
    return this.getFull(lessonId, false);
  }

  static async getForStudent(lessonId, studentId) {
    const video = await this.hasStudentAccess(lessonId, studentId);
    if (!video) return null;
    return this.getFull(lessonId, true, studentId);
  }

  static async getFull(lessonId, includePrivate, studentId) {
    const videoRes = await query(`SELECT ivl.*, l.title AS "lessonTitle"
      FROM "interactive_video_lessons" ivl JOIN "lessons" l ON l.id = ivl."lessonId"
      WHERE ivl."lessonId" = $1`, [lessonId]);
    if (!videoRes.rows[0]) return null;
    const video = videoRes.rows[0];
    const [activities, resources, progress] = await Promise.all([
      query(`SELECT * FROM "interactive_video_activities" WHERE "lessonId" = $1
             ORDER BY "timestampSeconds", "orderIndex"`, [lessonId]),
      query(`SELECT id, title, description, url, "resourceType", "canView", "canDownload", "orderIndex"
             FROM "interactive_video_resources" WHERE "lessonId" = $1 AND "canView" = true
             ORDER BY "orderIndex"`, [lessonId]),
      studentId ? query(`SELECT * FROM "interactive_video_progress"
             WHERE "lessonId" = $1 AND "studentId" = $2`, [lessonId, studentId]) : Promise.resolve({ rows: [] }),
    ]);
    return {
      ...video,
      ...(includePrivate ? {} : { createdBy: video.createdBy }),
      activities: activities.rows,
      resources: resources.rows,
      progress: progress.rows[0] || null,
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
    if (!allowedTypes.has(activity.type) || !activity.title || Number(activity.timestampSeconds) < 0) {
      throw Object.assign(new Error('Activity type, title and timestamp are required'), { status: 400, code: 'VALIDATION_ERROR' });
    }
    const activityId = activity.id || id();
    const values = [activityId, lessonId, Number(activity.timestampSeconds), activity.type, activity.title,
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

  static async submitAttempt(activityId, studentId, answer) {
    const activity = await query(`SELECT a.*, ivl."lessonId" FROM "interactive_video_activities" a
      JOIN "interactive_video_lessons" ivl ON ivl."lessonId"=a."lessonId" WHERE a.id=$1`, [activityId]);
    if (!activity.rows[0] || !(await this.hasStudentAccess(activity.rows[0].lessonId, studentId))) return null;
    const a = activity.rows[0];
    const content = a.content || {};
    const normalized = (value) => String(value ?? '').trim().toLowerCase();
    let correct = false;
    if (a.type === 'MULTIPLE_SELECT') correct = JSON.stringify([...(answer || [])].sort()) === JSON.stringify([...(content.correctAnswers || [])].sort());
    else if (a.type === 'ORDERING') correct = JSON.stringify(answer || []) === JSON.stringify(content.correctOrder || []);
    else if (a.type === 'MATCHING') correct = JSON.stringify(answer || {}) === JSON.stringify(content.pairs || {});
    else correct = normalized(answer) === normalized(content.correctAnswer) ||
      (Array.isArray(content.acceptableAnswers) && content.acceptableAnswers.some((x) => normalized(x) === normalized(answer)));
    const count = await query(`SELECT COUNT(*)::int AS count FROM "interactive_video_attempts" WHERE "activityId"=$1 AND "studentId"=$2`, [activityId, studentId]);
    const score = correct ? Number(a.points) : 0;
    const result = await query(`INSERT INTO "interactive_video_attempts"
      (id,"activityId","studentId",answer,"isCorrect",score,feedback,"attemptNumber")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id(), activityId, studentId, JSON.stringify(answer), correct, score, correct ? 'Correct — well done!' : (a.feedback || 'Review the explanation and try again.'), count.rows[0].count + 1]);
    return { ...result.rows[0], explanation: a.explanation, correctAnswer: correct ? undefined : content.correctAnswer };
  }

  static async saveProgress(lessonId, studentId, body) {
    if (!(await this.hasStudentAccess(lessonId, studentId))) return null;
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
}
