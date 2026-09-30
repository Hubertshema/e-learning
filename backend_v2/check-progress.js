import 'dotenv/config';
import { query } from './src/config/database.js';

async function main() {
  const studentId = 'ca6a0db0-be81-4c4b-bb1b-3bdc92ca18b3';
  const profileId = 'ee51773e-8697-4ab3-98f4-ac5387723202';
  
  let completedLessonIds = new Set();
  
  const progressRes = await query(
    `SELECT p."lessonId", p."isCompleted", p."timeSpentSec"
     FROM "public"."progress" p
     WHERE p."studentId" = $1 OR p."studentId" = $2`,
    [studentId, profileId]
  );
  for (const row of progressRes.rows) {
    if (row.isCompleted) completedLessonIds.add(row.lessonId);
  }

  const ivProgressRes = await query(
    `SELECT ivp."lessonId", ivp."watchedSeconds" 
     FROM "interactive_video_progress" ivp 
     WHERE (ivp."studentId" = $1 OR ivp."studentId" = $2) 
       AND (ivp."completionPercent" >= 90 OR ivp."completedAt" IS NOT NULL)`,
    [studentId, profileId]
  );
  for (const row of ivProgressRes.rows) {
    completedLessonIds.add(row.lessonId);
  }
  
  console.log('Completed lessons count:', completedLessonIds.size);
  
  const enrollmentsRes = await query(`SELECT "courseId" FROM enrollments WHERE "studentId" = $1 OR "studentId" = $2`, [studentId, profileId]);
  
  let totalLessons = 0;
  for(const e of enrollmentsRes.rows) {
     const unitsRes = await query(`SELECT id FROM units WHERE "courseId" = $1`, [e.courseId]);
     for(const u of unitsRes.rows) {
       const lRes = await query(`SELECT id FROM lessons WHERE "unitId" = $1`, [u.id]);
       totalLessons += lRes.rows.length;
     }
  }
  
  console.log('Total lessons:', totalLessons);

  process.exit(0);
}

main().catch(console.error);
