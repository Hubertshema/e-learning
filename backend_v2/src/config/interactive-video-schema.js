import { query } from './database.js';

/**
 * The project uses direct SQL rather than an ORM. Keep the feature schema
 * idempotent so existing installations can be upgraded without data loss.
 * Teams using a migration runner can use the same statements as a migration.
 */
export async function ensureInteractiveVideoSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS "interactive_video_lessons" (
      "lessonId" TEXT PRIMARY KEY REFERENCES "lessons"(id) ON DELETE CASCADE,
      "videoUrl" TEXT NOT NULL,
      "thumbnailUrl" TEXT,
      "durationSeconds" INTEGER NOT NULL DEFAULT 0 CHECK ("durationSeconds" >= 0),
      "cefrLevel" VARCHAR(10),
      "skill" VARCHAR(40) NOT NULL DEFAULT 'LISTENING',
      "transcript" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "captions" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "navigationMode" VARCHAR(20) NOT NULL DEFAULT 'FREE' CHECK ("navigationMode" IN ('FREE','GUIDED','REQUIRED_COMPLETION')),
      "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT','PUBLISHED')),
      "createdBy" TEXT NOT NULL REFERENCES "users"(id),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS "interactive_video_activities" (
      id UUID PRIMARY KEY,
      "lessonId" TEXT NOT NULL REFERENCES "interactive_video_lessons"("lessonId") ON DELETE CASCADE,
      "timestampSeconds" INTEGER NOT NULL CHECK ("timestampSeconds" >= 0),
      type VARCHAR(32) NOT NULL,
      title VARCHAR(200) NOT NULL,
      instructions TEXT,
      content JSONB NOT NULL DEFAULT '{}'::jsonb,
      points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 0),
      required BOOLEAN NOT NULL DEFAULT true,
      feedback TEXT,
      explanation TEXT,
      "orderIndex" INTEGER NOT NULL DEFAULT 0,
      "maxAttempts" INTEGER NOT NULL DEFAULT 0,
      "allowRetry" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "interactive_video_activities_lesson_time_idx"
      ON "interactive_video_activities" ("lessonId", "timestampSeconds", "orderIndex");
    CREATE TABLE IF NOT EXISTS "interactive_video_resources" (
      id UUID PRIMARY KEY,
      "lessonId" TEXT NOT NULL REFERENCES "interactive_video_lessons"("lessonId") ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      "resourceType" VARCHAR(30) NOT NULL DEFAULT 'LINK',
      "canView" BOOLEAN NOT NULL DEFAULT true,
      "canDownload" BOOLEAN NOT NULL DEFAULT false,
      "orderIndex" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS "interactive_video_progress" (
      id UUID PRIMARY KEY,
      "lessonId" TEXT NOT NULL REFERENCES "interactive_video_lessons"("lessonId") ON DELETE CASCADE,
      "studentId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
      "lastPositionSeconds" INTEGER NOT NULL DEFAULT 0,
      "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
      "completionPercent" NUMERIC(5,2) NOT NULL DEFAULT 0,
      "completedAt" TIMESTAMPTZ,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE ("lessonId", "studentId")
    );
    CREATE TABLE IF NOT EXISTS "interactive_video_attempts" (
      id UUID PRIMARY KEY,
      "activityId" UUID NOT NULL REFERENCES "interactive_video_activities"(id) ON DELETE CASCADE,
      "studentId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
      answer JSONB NOT NULL DEFAULT '{}'::jsonb,
      "isCorrect" BOOLEAN NOT NULL DEFAULT false,
      score NUMERIC(8,2) NOT NULL DEFAULT 0,
      feedback TEXT,
      "attemptNumber" INTEGER NOT NULL DEFAULT 1,
      "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "interactive_video_attempts_student_idx"
      ON "interactive_video_attempts" ("studentId", "activityId");
  `);
}
