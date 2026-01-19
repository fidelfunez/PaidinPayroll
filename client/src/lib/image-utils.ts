import imageCompression from 'browser-image-compression';

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  quality?: number;
}

export const defaultImageOptions: ImageCompressionOptions = {
  maxSizeMB: 0.5, // 500KB final size limit
  maxWidthOrHeight: 800, // Auto-resize: max 800px on longest side
  useWebWorker: true,
  fileType: 'image/webp', // Convert to WebP for best compression
  quality: 0.85, // 85% quality (optimal for WebP)
};

/**
 * Compresses and optimizes an image file for web use
 * Automatically converts to WebP format for best compression
 * Falls back to JPEG if WebP is not supported by the browser
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const compressionOptions = { ...defaultImageOptions, ...options };
  
  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error: any) {
    // If WebP fails (browser doesn't support it), fallback to JPEG
    if (compressionOptions.fileType === 'image/webp') {
      console.warn('WebP compression failed, falling back to JPEG:', error.message);
      try {
        const jpegOptions = {
          ...compressionOptions,
          fileType: 'image/jpeg',
          quality: 0.8,
        };
        const jpegFile = await imageCompression(file, jpegOptions);
        return jpegFile;
      } catch (jpegError) {
        console.error('JPEG compression also failed:', jpegError);
        throw new Error('Image compression failed. Please try a different image file.');
      }
    }
    console.error('Image compression failed:', error);
    throw error;
  }
}

/**
 * Converts a File to a base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validates image file size and type
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): string | null {
  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size must be less than ${maxSizeMB}MB`;
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, or WebP)';
  }

  return null;
}

/**
 * Gets file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 