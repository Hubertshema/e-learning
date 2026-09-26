import { initLevelsSchema } from './src/config/init-levels.js';
import { connectDatabase, pool } from './src/config/database.js';

async function run() {
  try {
    await connectDatabase();
    await initLevelsSchema();
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
