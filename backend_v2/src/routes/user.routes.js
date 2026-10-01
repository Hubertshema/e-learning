import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.patch('/profile', UserController.updateProfile);
router.get('/sessions', UserController.getSessions);
router.post('/sessions/logout-all', UserController.logoutAllSessions);
router.get('/students', UserController.listStudents);

export default router;
