import { query } from './src/config/database.js';

const tables = ['lessons', 'quizzes', 'assignments', 'units', 'classes', 'student_profiles', 'enrollments'];
for (const t of tables) {
  const res = await query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [t]
  );
  console.log(`\n### ${t}`);
  console.log(res.rows.map((r) => `${r.column_name}:${r.data_type}`).join('\n'));
}

const users = await query(`SELECT id, "firstName", "lastName", email, role FROM "public"."users" WHERE role='STUDENT' LIMIT 5`);
console.log('\n### sample students');
console.log(users.rows);

process.exit(0);
