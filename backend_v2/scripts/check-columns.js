import { query } from '../src/config/database.js';

async function checkColumns() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'courses'
      ORDER BY ordinal_position;
    `);
    console.log('Columns in courses table:');
    res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error('Error fetching columns:', err);
  }
}

checkColumns();
