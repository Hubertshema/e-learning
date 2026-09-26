import { query } from './database.js';

export async function initLevelsSchema() {
  console.log('🐘 Initializing Levels Schema...');
  
  try {
    // 1. Create levels table
    await query(`
      CREATE TABLE IF NOT EXISTS "public"."levels" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 2. Insert exactly 3 fixed levels idempotently
    const levels = [
      { name: 'Level 1', code: 'L1', description: 'Beginner Level' },
      { name: 'Level 2', code: 'L2', description: 'Intermediate Level' },
      { name: 'Level 3', code: 'L3', description: 'Advanced Level' }
    ];

    for (const level of levels) {
      await query(`
        INSERT INTO "public"."levels" ("name", "code", "description")
        VALUES ($1, $2, $3)
        ON CONFLICT ("code") DO NOTHING
      `, [level.name, level.code, level.description]);
    }

    // 3. Update student_profiles to have levelId
    // Add levelId column if it doesn't exist
    await query(`
      ALTER TABLE "public"."student_profiles" 
      ADD COLUMN IF NOT EXISTS "levelId" INTEGER REFERENCES "public"."levels"("id") ON DELETE SET NULL
    `);

    // 4. Create level_courses table
    await query(`
      CREATE TABLE IF NOT EXISTS "public"."level_courses" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        "levelId" INTEGER NOT NULL REFERENCES "public"."levels"("id") ON DELETE CASCADE,
        "courseId" TEXT NOT NULL REFERENCES "public"."courses"("id") ON DELETE CASCADE,
        "teacherId" TEXT REFERENCES "public"."users"("id") ON DELETE SET NULL,
        "maxStudents" INTEGER DEFAULT 30,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE("levelId", "courseId")
      )
    `);

    // 5. Create student_course_overrides table
    await query(`
      CREATE TABLE IF NOT EXISTS "public"."student_course_overrides" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        "studentId" TEXT NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "courseId" TEXT NOT NULL REFERENCES "public"."courses"("id") ON DELETE CASCADE,
        "levelCourseId" TEXT REFERENCES "public"."level_courses"("id") ON DELETE CASCADE,
        "status" VARCHAR(50) NOT NULL CHECK (status IN ('ALLOW', 'RESTRICT')),
        "reason" TEXT,
        "assignedBy" TEXT REFERENCES "public"."users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE("studentId", "courseId")
      )
    `);

    // 6. Create student_lesson_overrides table
    await query(`
      CREATE TABLE IF NOT EXISTS "public"."student_lesson_overrides" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        "studentId" TEXT NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "lessonId" TEXT NOT NULL REFERENCES "public"."lessons"("id") ON DELETE CASCADE,
        "status" VARCHAR(50) NOT NULL CHECK (status IN ('ALLOW', 'RESTRICT')),
        "reason" TEXT,
        "assignedBy" TEXT REFERENCES "public"."users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE("studentId", "lessonId")
      )
    `);

    // 7. Add levelCourseId and courseId to enrollments if they don't exist
    // We add them as nullable first, to avoid breaking existing data.
    await query(`
      ALTER TABLE "public"."enrollments" 
      ADD COLUMN IF NOT EXISTS "levelCourseId" TEXT REFERENCES "public"."level_courses"("id") ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS "courseId" TEXT REFERENCES "public"."courses"("id") ON DELETE CASCADE
    `);

    // Update the unique constraint on enrollments (studentId, levelCourseId) if it doesn't exist
    // Actually, we can't easily add a unique constraint if we have existing nulls or want to keep classId.
    // We'll create a new constraint specifically for levelCourseId
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_studentId_courseId_key'
        ) THEN
          ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_studentId_courseId_key" UNIQUE ("studentId", "courseId");
        END IF;
      END
      $$;
    `);

    console.log('✅ Levels Schema Initialized Successfully');
  } catch (error) {
    console.error('💥 Error initializing levels schema:', error);
    throw error;
  }
}
