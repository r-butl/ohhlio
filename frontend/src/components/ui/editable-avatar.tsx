import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface EditableAvatarProps {
  imageUrl?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onImageUpload: (file: File) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const EditableAvatar: React.FC<EditableAvatarProps> = ({
  imageUrl,
  alt = "Profile image",
  size = 'md',
  onImageUpload,
  disabled = false,
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const defaultIconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !disabled) {
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
    <div className={`relative ${className} ${interactive ? 'group' : ''}`}>
      <label className={`${interactive ? 'cursor-pointer' : ''} ${disabled ? 'cursor-default' : ''}`}>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          disabled={disabled || uploading}
        />
        <div className={`relative ${sizeClasses[size]} rounded-full bg-gray-200 ${interactive ? 'hover:bg-gray-300 cursor-pointer' : ''} transition-colors flex items-center justify-center`}>
          {imageUrl ? (
            <>
              <img 
                src={imageUrl} 
                alt={alt} 
                className="w-full h-full rounded-full object-cover"
              />
              {interactive && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center">
                  <Camera className={`${iconSizes[size]} text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              )}
            </>
          ) : (
            <Camera className={`${defaultIconSizes[size]} text-gray-500`} />
          )}
        </div>
      </label>
    </div>
  );
};

export default EditableAvatar;
