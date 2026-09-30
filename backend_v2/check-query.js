import 'dotenv/config';
import { query } from './src/config/database.js';

async function main() {
  const res = await query(`SELECT id FROM "public"."users" WHERE id = '4289ead0-bc41-4ca3-8528-742579586155'`);
  console.log('Teacher in users:', res.rows);
  
  const res2 = await query(`
    SELECT
      cert.id, cert."certificateCode", cert."levelCompleted", cert."finalGrade", cert."issueDate",
      c.title as "courseTitle", c.level as "courseLevel",
      u."firstName" as "teacherFirstName", u."lastName" as "teacherLastName"
    FROM "public"."certificates" cert
    JOIN "public"."courses" c ON c.id = cert."courseId"
    LEFT JOIN "public"."users" u ON u.id = c."teacherId"
  `);
  console.log('Certificates with LEFT JOIN:', res2.rows);

  process.exit(0);
}

main().catch(console.error);
