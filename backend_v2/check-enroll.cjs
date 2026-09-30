require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  const e = await client.query(`SELECT * FROM enrollments WHERE "studentId" IN ('ee51773e-8697-4ab3-98f4-ac5387723202', 'ca6a0db0-be81-4c4b-bb1b-3bdc92ca18b3')`);
  console.log("enrollments:", e.rows);
  const c = await client.query(`SELECT * FROM certificates`);
  console.log("certificates:", c.rows);
  const p = await client.query(`SELECT * FROM progress`);
  console.log("progress:", p.rows);
  process.exit(0);
});
