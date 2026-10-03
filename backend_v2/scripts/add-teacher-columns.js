import { query } from '../src/config/database.js';

async function run() {
  try {
    await query(`ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "whatsapp" VARCHAR(255);`);
    await query(`ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "supportEmail" VARCHAR(255);`);
    console.log("Successfully added columns.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
