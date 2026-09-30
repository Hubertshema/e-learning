require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  try {
    const courseId = '6f3c4e0e-f17b-43f7-a52d-0a6fbd2083d3';
    const u = await client.query(`SELECT id FROM units WHERE "courseId" = $1`, [courseId]);
    console.log('units:', u.rows);
    if (u.rows.length) {
      const l = await client.query(`SELECT id FROM lessons WHERE "unitId" IN (${u.rows.map(r => `'${r.id}'`).join(',')})`);
      console.log('lessons:', l.rows.length, l.rows);
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});
