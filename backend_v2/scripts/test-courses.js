import { query } from '../src/config/database.js';
import { SuperadminModel } from '../src/models/superadmin.model.js';

async function testFetch() {
  try {
    console.log('Testing live DB connection and courses fetch...');
    const dbCount = await query('SELECT count(*) FROM "public"."courses"');
    console.log('Total raw courses in database table:', dbCount.rows[0].count);

    const result = await SuperadminModel.getCourses({ page: 1, limit: 10 });
    console.log('Fetched via SuperadminModel.getCourses:');
    console.log('Total courses returned:', result.courses.length);
    console.log('Pagination info:', result.pagination);
    if (result.courses.length > 0) {
      console.log('Sample course from DB:', JSON.stringify(result.courses[0], null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error('Error fetching courses from database:', err);
    process.exit(1);
  }
}

testFetch();
