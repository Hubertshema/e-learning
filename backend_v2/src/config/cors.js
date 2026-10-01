import cors from 'cors';
import { env } from './env.js';

export function getAllowedOrigins() {
  const custom = (env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return Array.from(
    new Set([
      ...custom,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ])
  );
}

const isLocalNetworkOrigin = (origin) => {
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
    origin
  );
};

export const isOriginAllowed = (origin) => {
  // Allow requests with no origin (mobile apps, curl, postman, server-to-server)
  if (!origin) return true;

  const cleanOrigin = origin.replace(/\/+$/, '');
  const allowed = getAllowedOrigins();

  if (allowed.includes(cleanOrigin)) {
    return true;
  }

  // Allow all Vercel deployment and preview URLs (e.g. *.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(cleanOrigin)) {
    return true;
  }

  // Allow Render URLs if frontend is deployed on render
  if (/^https:\/\/[a-zA-Z0-9_.-]+\.onrender\.com$/.test(cleanOrigin)) {
    return true;
  }

  // Allow local LAN connections in non-production
  if (env.NODE_ENV !== 'production' && isLocalNetworkOrigin(cleanOrigin)) {
    return true;
  }

  return false;
};

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
});

