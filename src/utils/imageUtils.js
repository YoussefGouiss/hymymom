/**
 * Image utilities for family profile photos
 * Handles validation, compression, and processing
 */

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validates image file before upload
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateImage(file) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid image format. Please use JPEG, PNG, or WebP.' 
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: 'Image must be smaller than 2MB' 
    };
  }

  return { valid: true };
}

/**
 * Compresses image and returns as Blob
 * Uses canvas API to resize and compress
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width (default: 800)
 * @param {number} maxHeight - Maximum height (default: 800)
 * @param {number} quality - Compression quality 0-1 (default: 0.8)
 * @returns {Promise<Blob>}
 */
export function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type || 'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Creates a preview URL for an image file
 * @param {File} file - The image file
 * @returns {string} - Data URL for preview
 */
export function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}

/**
 * Generates a filename for the uploaded image
 * @param {string} familyId - The family ID
 * @param {string} originalName - Original filename
 * @returns {string} - Generated filename
 */
export function generateFileName(familyId, originalName) {
  const ext = originalName.split('.').pop();
  const timestamp = Date.now();
  return `${familyId}-${timestamp}.${ext}`;
}

/**
 * Constructs the storage path for a family photo
 * @param {string} userId - The user ID
 * @param {string} familyId - The family ID
 * @param {string} fileName - The filename
 * @returns {string} - Full storage path
 */
export function getStoragePath(userId, familyId, fileName) {
  return `${userId}/${familyId}/${fileName}`;
}
