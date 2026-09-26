import { apiClient } from './api-client';
import { LessonBlock } from '@/components/lesson-builder/types';

interface PendingItem {
  fileOrBlob: Blob | File;
  resourceType: 'image' | 'video' | 'raw';
  folder: string;
}

// Global registry of local blob URLs awaiting automatic upload on document save
const pendingMediaRegistry = new Map<string, PendingItem>();

/**
 * Register a local media file or recording blob to be automatically uploaded when saving
 */
export function registerPendingMedia(
  localUrl: string,
  fileOrBlob: Blob | File,
  resourceType: 'image' | 'video' | 'raw' = 'image',
  folder = 'elearning/media'
) {
  pendingMediaRegistry.set(localUrl, { fileOrBlob, resourceType, folder });
}

/**
 * Check if a URL has pending media awaiting Cloudinary upload
 */
export function hasPendingMedia(url?: string): boolean {
  if (!url) return false;
  return pendingMediaRegistry.has(url) || url.startsWith('blob:');
}

/**
 * Automatically uploads all pending media files in the lesson blocks to Cloudinary.
 * Replaces temporary blob URLs with permanent Cloudinary URLs.
 * Returns the updated blocks array ready for database storage.
 */
export async function uploadAllPendingBlocks(blocks: LessonBlock[]): Promise<LessonBlock[]> {
  const updatedBlocks = await Promise.all(
    blocks.map(async (block) => {
      // Only media blocks (image, video, audio)
      if (!['image', 'video', 'audio'].includes(block.type)) {
        return block;
      }

      const url = block.content?.url;
      if (!url) return block;

      const pending = pendingMediaRegistry.get(url);

      // If registered in pending map or is a blob: URL
      if (pending || url.startsWith('blob:')) {
        try {
          let fileToUpload: Blob | File;
          let resourceType = pending?.resourceType || (block.type === 'image' ? 'image' : 'video');
          let folder = pending?.folder || `elearning/${block.type}s`;

          if (pending?.fileOrBlob) {
            fileToUpload = pending.fileOrBlob;
          } else {
            // Fetch blob from blob: URL
            const res = await fetch(url);
            fileToUpload = await res.blob();
          }

          // Generate a clean filename
          const ext =
            block.type === 'image'
              ? 'png'
              : block.type === 'audio'
              ? 'webm'
              : 'mp4';
          const filename = `${block.type}-${Date.now()}.${ext}`;

          const formData = new FormData();
          formData.append('file', fileToUpload, filename);
          formData.append('resourceType', resourceType);
          formData.append('folder', folder);

          console.log(`🚀 [Auto-Upload] Uploading ${block.type} to Cloudinary...`);
          const uploadRes: any = await apiClient.upload('/upload/media', formData);
          const data = uploadRes?.data || uploadRes;

          if (data?.url) {
            console.log(`✅ [Auto-Upload] Saved ${block.type} to Cloudinary:`, data.url);
            pendingMediaRegistry.delete(url);

            return {
              ...block,
              content: {
                ...block.content,
                url: data.url,
                publicId: data.publicId,
                bytes: data.bytes,
                format: data.format,
                isPendingUpload: false,
              },
            };
          }
        } catch (err: any) {
          console.error(`💥 [Auto-Upload Error] Failed to upload ${block.type}:`, err);
        }
      }

      return block;
    })
  );

  return updatedBlocks;
}
