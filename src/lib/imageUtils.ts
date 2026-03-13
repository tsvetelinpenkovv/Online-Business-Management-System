/**
 * Client-side image compression utility
 * Uses Canvas API to resize and convert images to WebP before upload
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'image/webp',
};

/**
 * Compress an image file using Canvas API
 * Returns a new File with reduced size
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip compression for SVGs and ICOs
  if (file.type === 'image/svg+xml' || file.type === 'image/x-icon' || file.type === 'image/ico') {
    return file;
  }

  // Skip if file is already small (< 100KB)
  if (file.size < 100 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      const maxW = opts.maxWidth!;
      const maxH = opts.maxHeight!;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fallback to original
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compressed is larger, return original
            resolve(file);
            return;
          }

          const ext = opts.format === 'image/webp' ? 'webp' : opts.format === 'image/jpeg' ? 'jpg' : 'png';
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const newFile = new File([blob], `${baseName}.${ext}`, {
            type: opts.format!,
            lastModified: Date.now(),
          });

          console.log(
            `Image compressed: ${(file.size / 1024).toFixed(0)}KB → ${(newFile.size / 1024).toFixed(0)}KB (${Math.round((1 - newFile.size / file.size) * 100)}% reduction)`
          );

          resolve(newFile);
        },
        opts.format,
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original on error
    };

    img.src = url;
  });
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<File> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'image/webp',
  });
}

/**
 * Preset for logo compression (smaller dimensions)
 */
export function compressLogo(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
    format: 'image/webp',
  });
}

/**
 * Preset for favicon compression
 */
export function compressFavicon(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 256,
    maxHeight: 256,
    quality: 0.9,
    format: 'image/png', // Favicons work best as PNG
  });
}

/**
 * Preset for background image compression
 */
export function compressBackground(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'image/webp',
  });
}
