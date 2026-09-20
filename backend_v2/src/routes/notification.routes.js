import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.list);
router.patch('/:id/read', NotificationController.markRead);
router.patch('/read-all', NotificationController.markAllRead);

export default router;
