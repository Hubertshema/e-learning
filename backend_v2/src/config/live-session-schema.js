import { query } from './database.js';

/**
 * Live Session Database Schema Initializer
 * Creates tables for Live Sessions and Participants if not already present.
 */
export async function ensureLiveSessionSchema() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS "live_sessions" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "teacherId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        topic TEXT,
        type VARCHAR(20) NOT NULL DEFAULT 'ONE_ON_ONE' CHECK (type IN ('ONE_ON_ONE', 'GROUP')),
        status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'ENDED')),
        "scheduledAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "startedAt" TIMESTAMPTZ,
        "endedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "live_session_participants" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "sessionId" TEXT NOT NULL REFERENCES "live_sessions"(id) ON DELETE CASCADE,
        "studentId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'JOINED', 'LEFT', 'REMOVED')),
        "joinedAt" TIMESTAMPTZ,
        "leftAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("sessionId", "studentId")
      );

      CREATE INDEX IF NOT EXISTS "live_sessions_teacher_status_idx" 
        ON "live_sessions" ("teacherId", "status");

      CREATE INDEX IF NOT EXISTS "live_session_participants_student_status_idx" 
        ON "live_session_participants" ("studentId", "status");

      CREATE INDEX IF NOT EXISTS "live_session_participants_session_idx" 
        ON "live_session_participants" ("sessionId");
    `);

    console.log('✅ Live Session database schema verified');
  } catch (err) {
    console.error('❌ Failed to ensure live session schema:', err.message);
    throw err;
  }
}
