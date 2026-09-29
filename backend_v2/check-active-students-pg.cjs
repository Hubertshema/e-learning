const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_hajq07EkJsev@ep-falling-bird-b5ga2g7o-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT COUNT(DISTINCT e."studentId") AS total 
      FROM "public"."enrollments" e
      JOIN "public"."courses" c ON c.id = e."courseId"
      WHERE e.status = 'ACTIVE'
    `);
    console.log('Active Students from Enrollments:', res.rows[0].total);
    
    // Also check total students in the system
    const res2 = await pool.query(`SELECT COUNT(*) as total FROM "public"."users" WHERE role = 'STUDENT'`);
    console.log('Total students in users table:', res2.rows[0].total);

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
