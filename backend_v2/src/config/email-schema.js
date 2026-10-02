import { query } from './database.js';

/**
 * Initializes tables for Contact Inquiries, Newsletter Subscribers, and Password Reset Tokens.
 */
export async function ensureEmailSchema() {
  try {
    await query(`
      -- 1. Contact Inquiries Table
      CREATE TABLE IF NOT EXISTS "contact_messages" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'UNREAD',
        "replyMessage" TEXT,
        "repliedBy" TEXT REFERENCES "users"(id) ON DELETE SET NULL,
        "repliedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE "contact_messages"
        ADD COLUMN IF NOT EXISTS "replyMessage" TEXT,
        ADD COLUMN IF NOT EXISTS "repliedBy" TEXT REFERENCES "users"(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMPTZ;

      CREATE INDEX IF NOT EXISTS "idx_contact_messages_email" ON "contact_messages"("email");
      CREATE INDEX IF NOT EXISTS "idx_contact_messages_status" ON "contact_messages"("status");
      CREATE INDEX IF NOT EXISTS "idx_contact_messages_created" ON "contact_messages"("createdAt" DESC);

      -- 2. Newsletter Subscribers Table
      CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNSUBSCRIBED')),
        "subscribedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "unsubscribedAt" TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS "idx_newsletter_email" ON "newsletter_subscribers"("email");

      -- 3. Password Resets Table
      CREATE TABLE IF NOT EXISTS "password_resets" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "usedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "idx_password_resets_token" ON "password_resets"("token");
      CREATE INDEX IF NOT EXISTS "idx_password_resets_user" ON "password_resets"("userId");
    `);

    console.log('✅ Contact messages, newsletter, and password resets database schema verified');
  } catch (err) {
    console.error('❌ Failed to ensure email schema:', err.message);
    throw err;
  }
}
