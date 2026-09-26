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
      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;

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
        // Fallback for development if Cloudinary credentials are not yet entered in .env
        const base64Data = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        return sendSuccess(
          res,
          {
            url: base64Data,
            publicId: `dev_${Date.now()}`,
            format: mimeType.split('/')[1] || 'bin',
            resourceType: mimeType.split('/')[0] || 'auto',
            bytes: fileBuffer.length,
            isLocalFallback: true,
            originalName,
          },
          'Uploaded locally (Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend_v2/.env for production Cloudinary hosting)'
        );
      }
    } catch (error) {
      console.error('[UploadController Error]', error);
      return sendError(res, error.message || 'Failed to upload media file', 500);
    }
  }
}
