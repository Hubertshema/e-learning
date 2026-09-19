import { Router } from 'express';
import { publicController } from '../controllers/public.controller.js';

const router = Router();

// Publicly accessible without authentication (Section 37)
router.get('/certificates/:code', publicController.verifyCertificate);
router.get('/stats', publicController.getPlatformStats);

export default router;
