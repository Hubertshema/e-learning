import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './config/cors.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import v1Routes from './routes/index.js';
import { sendError } from './utils/response.util.js';

export function createApp() {
  const app = express();

  // Trust proxy for reverse proxies
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // CORS
  app.use(corsMiddleware);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parser
  app.use(cookieParser());

  // Request logger
  app.use(requestLogger);

  // Mount API v1
  app.use('/api/v1', v1Routes);

  // 404 handler
  app.use((req, res) => {
    return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
