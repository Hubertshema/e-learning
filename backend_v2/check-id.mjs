import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;
const c = new Client(process.env.DATABASE_URL);
c.connect()
  .then(() => c.query(`SELECT * FROM student_profiles WHERE id = 'ee51773e-8697-4ab3-98f4-ac5387723202' OR "userId" = 'ee51773e-8697-4ab3-98f4-ac5387723202'`))
  .then(r => console.log('Profile:', r.rows))
  .then(() => c.query(`SELECT * FROM users WHERE id = 'ee51773e-8697-4ab3-98f4-ac5387723202'`))
  .then(r => console.log('User:', r.rows))
  .catch(console.error)
  .finally(() => c.end());
