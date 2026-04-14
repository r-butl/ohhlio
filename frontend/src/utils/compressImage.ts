interface CompressOptions {
  maxWidth?: number;  // px — image will be scaled down to fit within this width
  maxHeight?: number; // px — image will be scaled down to fit within this height
  quality?: number;   // 0–1 JPEG quality (default 0.85)
}

/**
 * Compresses an image file using the browser Canvas API.
 * Scales the image down to fit within maxWidth/maxHeight (preserving aspect ratio),
 * then re-encodes as JPEG at the given quality. Returns a new File.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Scale down if either dimension exceeds the max, preserving aspect ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas 2D context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas compression failed'));
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
          );
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}
