import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Configure memory storage for Cloudinary buffer stream
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for video/audio
  },
});

// Media upload endpoint: accepts single 'file'
router.post('/media', optionalAuth, upload.single('file'), UploadController.uploadMedia);

export default router;
