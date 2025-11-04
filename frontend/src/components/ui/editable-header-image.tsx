import React, { useState } from 'react';
import { Image, Upload } from 'lucide-react';

interface EditableHeaderImageProps {
  imageUrl?: string;
  alt?: string;
  height?: 'sm' | 'md' | 'lg';
  onImageUpload: (file: File) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const EditableHeaderImage: React.FC<EditableHeaderImageProps> = ({
  imageUrl,
  alt = "Header image",
  height = 'md',
  onImageUpload,
  disabled = false,
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);

  const aspectRatioClasses = {
    sm: 'aspect-[4/1]',   // 4:1 ratio
    md: 'aspect-[16/6]',  // ~2.67:1 ratio
    lg: 'aspect-video'    // 16:9 ratio
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !disabled) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      try {
        setUploading(true);
        await onImageUpload(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const interactive = !disabled && !uploading;

  return (
    <div className={`relative w-full ${aspectRatioClasses[height]} ${className} ${interactive ? 'group' : ''}`}>
      {interactive ? (
        <label className={`block w-full h-full cursor-pointer`} htmlFor="file-upload">
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={disabled || uploading}
          />
          <div className={`relative w-full h-full bg-muted rounded-lg overflow-hidden`}>
            {imageUrl ? (
              <>
                <img 
                  src={imageUrl} 
                  alt={alt} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <Image className={`${iconSizes[height]} text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Upload className={`${iconSizes[height]} mb-2`} />
                  <span className="text-sm">Upload header image</span>
                </div>
              </div>
            )}
          </div>
        </label>
      ) : (
        <div className={`relative w-full h-full rounded-lg overflow-hidden`}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={alt} 
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default EditableHeaderImage;
