import 'dotenv/config';
import { query } from './src/config/database.js';

async function main() {
  const res = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'interactive_video_progress'`);
  console.log(res.rows);
  
  process.exit(0);
}

main().catch(console.error);
