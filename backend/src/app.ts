import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import v1Routes from './routes/index.js';
import { sendError } from './utils/response.util.js';

import { getSwaggerHtml, openApiSpec } from './config/swagger.config.js';

export function createApp(): Express {
  const app = express();

  // Trust reverse proxies
  app.set('trust proxy', 1);

  // Security headers with CSP configured for Swagger UI and API security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://unpkg.com', 'https://images.unsplash.com', 'https://api.dicebear.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: ["'self'", 'https://unpkg.com', 'http://localhost:5000', 'http://127.0.0.1:5000'],
        },
      },
    })
  );

  // CORS Configuration
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS error: Origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Request logger
  app.use(requestLogger);

  // Global rate limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later.',
      },
    },
  });
  app.use('/api', limiter);

  // OpenAPI Swagger Documentation
  app.get('/api/docs', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(getSwaggerHtml());
  });

  app.get('/api/docs/openapi.json', (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'FluentEdge Academy Backend Server',
      status: 'ONLINE',
      apiDocs: 'http://localhost:5000/api/docs',
      apiV1: 'http://localhost:5000/api/v1',
      health: 'http://localhost:5000/api/v1/health',
      frontend: env.FRONTEND_URL,
    });
  });

  // Mount API version 1
  app.use('/api/v1', v1Routes);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    sendError(res, `Cannot ${req.method} ${req.originalUrl} - Route not found`, 'NOT_FOUND', 404);
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
