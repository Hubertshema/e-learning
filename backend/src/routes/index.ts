import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import superadminRoutes from './superadmin.routes.js';
import teacherRoutes from './teacher.routes.js';
import studentRoutes from './student.routes.js';
import activityRoutes from './activity.routes.js';
import notificationRoutes from './notification.routes.js';
import publicRoutes from './public.routes.js';
import { sendSuccess } from '../utils/response.util.js';

const router = Router();

// API v1 Index & Welcome
router.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      name: 'FluentEdge Academy REST API',
      version: '1.0.0',
      status: 'ONLINE',
      docsUrl: '/api/docs',
      healthUrl: '/api/v1/health',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
    'FluentEdge Academy API v1 is online'
  );
});

// Health Check
router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
    'API service is healthy'
  );
});

// Mount modules
router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/students', studentRoutes);
router.use('/activities', activityRoutes);
router.use('/notifications', notificationRoutes);

export default router;
