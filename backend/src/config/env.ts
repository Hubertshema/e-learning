import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/elearning_db?schema=public',

  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-minimum-32-chars-key!',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-minimum-32-chars-key!',
    ACCESS_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    REFRESH_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  STORAGE: {
    PROVIDER: process.env.STORAGE_PROVIDER || 'local',
    BUCKET: process.env.STORAGE_BUCKET || 'elearning-uploads',
    ACCESS_KEY: process.env.STORAGE_ACCESS_KEY || '',
    SECRET_KEY: process.env.STORAGE_SECRET_KEY || '',
  },

  EMAIL: {
    SERVER: process.env.EMAIL_SERVER || 'smtp://localhost:1025',
    FROM: process.env.EMAIL_FROM || 'noreply@englishplatform.com',
  },
};
