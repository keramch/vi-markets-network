import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseStorage } from './firebase';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates an image file against the allowed types and max size.
 * Returns an error string, or null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: Only JPG, PNG, WebP, HEIC, and AVIF images are accepted.`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `${file.name}: File exceeds the 5 MB size limit.`;
  }
  return null;
}

/**
 * Uploads a single image file to Firebase Storage at the given path.
 * Uses uploadBytes (simple multipart upload) to avoid the resumable-upload
 * handshake, which requires a separate CORS preflight for x-goog-resumable.
 * Resolves with the public download URL.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(firebaseStorage, path);
  const result = await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(result.ref);
}
