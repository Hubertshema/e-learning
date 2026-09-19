import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { UpdateProfileSchema, ChangePasswordSchema } from '../validators/user.validator.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(UpdateProfileSchema), userController.updateProfile);
router.post('/photo', userController.uploadPhoto);
router.delete('/photo', userController.removePhoto);
router.post('/change-password', validate(ChangePasswordSchema), userController.changePassword);

router.get('/sessions', userController.getActiveSessions);
router.post('/sessions/logout-all', userController.logoutAllDevices);

export default router;
