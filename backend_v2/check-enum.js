import 'dotenv/config';
import { query } from './src/config/database.js';

async function main() {
  const res = await query(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE typname = 'EnrollmentStatus'
  `);
  console.log(res.rows);
  process.exit(0);
}

main().catch(console.error);
