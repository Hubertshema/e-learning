import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './config/cors.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import v1Routes from './routes/index.js';
import { sendError } from './utils/response.util.js';

import path from 'path';

export function createApp() {
  const app = express();

  // Trust proxy for reverse proxies
  app.set('trust proxy', 1);

  // Security headers with cross-origin media support and iframe permission
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  }));

  // CORS
  app.use(corsMiddleware);

  // Static uploads directory with open headers for iframe embedding and cross-origin access
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.removeHeader('X-Frame-Options');
    next();
  }, express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
      res.removeHeader('X-Frame-Options');
      if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
      }
    }
  }));

  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
