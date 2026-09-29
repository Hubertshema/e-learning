const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_hajq07EkJsev@ep-falling-bird-b5ga2g7o-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT c.id, c.title, 
      (SELECT COUNT(*) FROM enrollments e WHERE e."courseId" = c.id) as count 
      FROM courses c
    `);
    console.table(res.rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
