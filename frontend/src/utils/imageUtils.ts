export interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export const applyCropToImage = async (
  imageUrl: string, 
  cropSettings: CropSettings,
  targetWidth?: number,
  targetHeight?: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size to target size or crop size
      canvas.width = targetWidth || cropSettings.width;
      canvas.height = targetHeight || cropSettings.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply zoom if needed
      const scaleX = img.width / (img.naturalWidth || img.width);
      const scaleY = img.height / (img.naturalHeight || img.height);
      
      // Draw the cropped portion
      ctx.drawImage(
        img,
        cropSettings.x * scaleX,
        cropSettings.y * scaleY,
        cropSettings.width * scaleX,
        cropSettings.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      // Convert to data URL
      const croppedImageData = canvas.toDataURL('image/jpeg', 0.9);
      resolve(croppedImageData);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}; 