import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

import { AdmissionController } from '../controllers/admission.controller.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/apply', AdmissionController.submitApplication);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;
