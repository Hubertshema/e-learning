import 'dotenv/config';
import { query } from './src/config/database.js';

async function main() {
  const res = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'lessons'`);
  console.log(res.rows.map(r=>r.column_name));
  process.exit(0);
}

main().catch(console.error);
