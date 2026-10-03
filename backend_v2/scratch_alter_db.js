import { query } from './src/config/database.js';

async function main() {
  try {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "activeSessionId" VARCHAR(255)');
    console.log('Successfully added activeSessionId column');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
