import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

// Configure Cloudinary credentials if available
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload a Buffer or Stream to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {Object} options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export function uploadBufferToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    // If Cloudinary is not configured, warn and return error with helpful instructions
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return reject(
        new Error(
          'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend_v2/.env'
        )
      );
    }

    const uploadOptions = {
      resource_type: options.resourceType || 'auto',
      folder: options.folder || 'elearning/lessons',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    uploadStream.end(fileBuffer);
  });
}

export default cloudinary;
