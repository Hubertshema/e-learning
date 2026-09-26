import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import courseRoutes from './course.routes.js';
import classRoutes from './class.routes.js';
import notificationRoutes from './notification.routes.js';
import teacherRoutes from './teacher.routes.js';
import aiRoutes from './ai.routes.js';
import publicRoutes from './public.routes.js';
import studentRoutes from './student.routes.js';
import superadminRoutes from './superadmin.routes.js';
import { HealthController } from '../controllers/health.controller.js';
import { sendSuccess } from '../utils/response.util.js';

const router = Router();

// API v1 Welcome
router.get('/', (_req, res) => {
  return sendSuccess(res, {
    name: 'FluentEdge E-Learning API v2',
    version: '2.0.0',
    runtime: 'Node.js + Express.js',
    realtime: 'Socket.IO',
    database: 'PostgreSQL Direct Pool',
    healthCheck: '/api/v1/health',
  }, 'FluentEdge API v2 is online');
});

// Health check endpoint
router.get('/health', HealthController.check);

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/classes', classRoutes);
router.use('/notifications', notificationRoutes);
router.use('/teacher', teacherRoutes);
router.use('/ai', aiRoutes);
router.use('/public', publicRoutes);
router.use('/student', studentRoutes);
router.use('/superadmin', superadminRoutes);

export default router;
