import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;
const c = new Client(process.env.DATABASE_URL);
c.connect()
  .then(() => c.query(`
    SELECT
      cert.id, cert."certificateCode", cert."levelCompleted", cert."finalGrade", cert."issueDate",
      c.title as "courseTitle", c.level as "courseLevel",
      u."firstName" as "teacherFirstName", u."lastName" as "teacherLastName"
    FROM "public"."certificates" cert
    JOIN "public"."courses" c ON c.id = cert."courseId"
    LEFT JOIN "public"."users" u ON u.id = c."teacherId"
    WHERE cert."studentId" = $1 OR cert."studentId" = (SELECT id FROM "public"."student_profiles" WHERE "userId" = $1 LIMIT 1)
    ORDER BY cert."issueDate" DESC`,
    ['ca6a0db0-be81-4c4b-bb1b-3bdc92ca18b3']
  ))
  .then(r => console.log('Returned rows:', r.rows))
  .catch(console.error)
  .finally(() => c.end());
