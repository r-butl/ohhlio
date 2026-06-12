import React, { useState } from 'react';
import { Camera } from 'lucide-react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface ProfileAvatarProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  editable?: boolean;           // enables upload affordance when true
  onImageUpload?: (file: File) => Promise<void>;
  className?: string;
}

const sizeToClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-32 h-32',
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  alt = 'Profile image',
  size = 'md',
  editable = false,
  onImageUpload,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const interactive = editable && !uploading && Boolean(onImageUpload);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !interactive || !onImageUpload) return;
    try {
      setUploading(true);
      await onImageUpload(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative ${className} ${interactive ? 'group' : ''}`}>
      {interactive && (
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          disabled={!interactive}
          aria-label="Upload profile image"
        />
      )}
      <div
        className={`relative ${sizeToClasses[size]} rounded-full bg-gray-200 overflow-hidden flex items-center justify-center ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="text-gray-500">O</div>
        )}
        {interactive && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileAvatar;


