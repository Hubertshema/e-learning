import { query } from './src/config/database.js';

async function setup() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS "public"."certificates" (
        "id" VARCHAR(255) PRIMARY KEY,
        "studentId" VARCHAR(255) NOT NULL,
        "courseId" VARCHAR(255) NOT NULL,
        "certificateCode" VARCHAR(255) NOT NULL UNIQUE,
        "levelCompleted" VARCHAR(255) NOT NULL,
        "finalGrade" NUMERIC(5,2) NOT NULL,
        "issueDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT "fk_student" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_course" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE CASCADE
      );
    `);
    console.log('Certificates table created successfully');
  } catch (err) {
    console.error('Error creating certificates table:', err);
  }
  process.exit();
}

setup();
