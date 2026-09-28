import { query } from './database.js';

/**
 * Initializes Student Application, Admission, Payment Decision, Learning Access, and Audit Trail schema
 */
export async function initAdmissionSchema() {
  console.log('📋 Initializing Student Admission & Learning Access Schema...');

  try {
    // 1. Add application & admission columns to student_profiles
    await query(`
      ALTER TABLE "public"."student_profiles"
      ADD COLUMN IF NOT EXISTS "admissionType" VARCHAR(50) DEFAULT 'DIRECT',
      ADD COLUMN IF NOT EXISTS "applicationStatus" VARCHAR(50) DEFAULT 'ACCEPTED',
      ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
      ADD COLUMN IF NOT EXISTS "applicationData" JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS "paymentRequirement" VARCHAR(50) DEFAULT 'PAYMENT_NOT_REQUIRED',
      ADD COLUMN IF NOT EXISTS "paymentStatus" VARCHAR(50) DEFAULT 'UNPAID',
      ADD COLUMN IF NOT EXISTS "learningAccess" VARCHAR(50) DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT REFERENCES "public"."users"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP WITH TIME ZONE;
    `);

    // 2. Create student status audit log table
    await query(`
      CREATE TABLE IF NOT EXISTS "public"."student_status_audits" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        "studentId" TEXT NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "changedBy" TEXT NOT NULL,
        "action" VARCHAR(100) NOT NULL,
        "fromState" JSONB DEFAULT '{}'::jsonb,
        "toState" JSONB DEFAULT '{}'::jsonb,
        "notes" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS "idx_status_audits_student" ON "public"."student_status_audits"("studentId");
    `);

    // 3. Ensure existing records have valid default values
    await query(`
      UPDATE "public"."student_profiles"
      SET 
        "admissionType" = COALESCE("admissionType", 'DIRECT'),
        "applicationStatus" = COALESCE("applicationStatus", 'ACCEPTED'),
        "paymentRequirement" = COALESCE("paymentRequirement", 'PAYMENT_NOT_REQUIRED'),
        "paymentStatus" = COALESCE("paymentStatus", 'UNPAID'),
        "learningAccess" = COALESCE("learningAccess", 'ACTIVE')
      WHERE "admissionType" IS NULL 
         OR "applicationStatus" IS NULL 
         OR "paymentRequirement" IS NULL 
         OR "learningAccess" IS NULL;
    `);

    console.log('✅ Student Admission & Learning Access Schema successfully initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize Admission Schema:', error.message);
  }
}
