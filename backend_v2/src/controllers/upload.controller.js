import fs from 'fs';
import path from 'path';
import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { env } from '../config/env.js';

export class UploadController {
  /**
   * Upload media file (image, audio, video, document)
   */
  static async uploadMedia(req, res) {
    try {
      if (!req.file) {
        return sendError(res, 'No file was uploaded.', 400);
      }

      const { folder = 'elearning/lessons', resourceType = 'auto' } = req.body;
      const fileBuffer = req.file.buffer;
      const originalName = req.file.originalname || 'file';
      const mimeType = req.file.mimetype || 'application/octet-stream';

      // Check if Cloudinary credentials are provided
      if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
        const result = await uploadBufferToCloudinary(fileBuffer, {
          folder,
          resourceType,
        });

        return sendSuccess(
          res,
          {
            url: result.secure_url || result.url,
            publicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes,
            duration: result.duration || null,
            originalName,
          },
          'Media uploaded to Cloudinary successfully'
        );
      } else {
        // High-performance local file storage for videos, PDFs, and media assets
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const ext = path.extname(originalName) || `.${mimeType.split('/')[1] || 'bin'}`;
        const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${cleanBase}_${Date.now()}${ext}`;
        const targetPath = path.join(uploadsDir, filename);

        await fs.promises.writeFile(targetPath, fileBuffer);

        const host = req.get('host') || `localhost:${env.PORT || 5000}`;
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const fileUrl = `${protocol}://${host}/uploads/${filename}`;

        return sendSuccess(
          res,
          {
            url: fileUrl,
            publicId: filename,
            format: ext.replace('.', ''),
            resourceType: mimeType.split('/')[0] || 'auto',
            bytes: fileBuffer.length,
            isLocal: true,
            originalName,
          },
          'File uploaded locally successfully'
        );
      }
    } catch (error) {
      console.error('[UploadController Error]', error);
      return sendError(res, error.message || 'Failed to upload media file', 500);
    }
  }
}
