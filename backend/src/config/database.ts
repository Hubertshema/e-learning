import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL database connected successfully via Prisma');

    // Ensure ai_generations table exists if migrations were not run
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "AIGenerationType" AS ENUM (
            'LESSON', 'ACTIVITY', 'ASSIGNMENT', 'QUIZ', 'EXAM', 'ASSESSMENT',
            'RUBRIC', 'ANSWER_KEY', 'FEEDBACK', 'GRADING_SUGGESTION', 'CHAT', 'PERFORMANCE_RECOMMENDATION'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;

        CREATE TABLE IF NOT EXISTS "ai_generations" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "teacherId" TEXT NOT NULL,
          "type" "AIGenerationType" NOT NULL,
          "title" TEXT NOT NULL,
          "prompt" TEXT NOT NULL,
          "inputContext" JSONB,
          "output" JSONB NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'COMPLETED',
          "model" TEXT NOT NULL DEFAULT 'fluentedge-curriculum-engine',
          "tokensUsed" INTEGER NOT NULL DEFAULT 0,
          "courseId" TEXT,
          "unitId" TEXT,
          "lessonId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ai_generations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE INDEX IF NOT EXISTS "ai_generations_teacherId_idx" ON "ai_generations"("teacherId");
        CREATE INDEX IF NOT EXISTS "ai_generations_type_idx" ON "ai_generations"("type");
      `);
      console.log('✅ ai_generations table structure verified');
    } catch (tblErr) {
      console.warn('ai_generations table check note:', tblErr);
    }
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL database:', error);
  }
}
