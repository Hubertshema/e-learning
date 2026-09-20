import { query } from './src/config/database.js';

for (const t of ['progress', 'lessons', 'quizzes', 'assignments', 'assignment_submissions', 'units', 'classes', 'enrollments']) {
  const res = await query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [t]
  );
  console.log(`\n### ${t}`);
  console.log(res.rows.map((r) => `${r.column_name}:${r.data_type}`).join('\n'));
}

const en = await query(
  `SELECT e.id AS "enrollmentId", e."studentId", e."courseId", e."classId", e.status, e."enrolledAt", e."expiresAt",
          u.id AS userId, u."firstName", u."lastName", u.email,
          c.title AS "courseTitle", c.level,
          cl.name AS "className"
   FROM "public"."enrollments" e
   JOIN "public"."users" u ON u.id = e."studentId"
   JOIN "public"."courses" c ON c.id = e."courseId"
   LEFT JOIN "public"."classes" cl ON cl.id = e."classId"
   LIMIT 5`
);
console.log('\n### sample enrollments rows');
console.log(en.rows);

const prog = await query(
  `SELECT p.id, p."studentId", p."lessonId", p."isCompleted", p."timeSpentSec",
          l.title, l.skill
   FROM "public"."progress" p
   JOIN "public"."lessons" l ON l.id = p."lessonId"
   LIMIT 5`
);
console.log('\n### sample progress rows');
console.log(prog.rows);

process.exit(0);
