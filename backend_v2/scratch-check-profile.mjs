import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
async function run() {
  try {
    const profRes = await pool.query('SELECT * FROM public.student_profiles WHERE id = $1', ['ee51773e-8697-4ab3-98f4-ac5387723202']);
    console.log('Profile:', profRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
