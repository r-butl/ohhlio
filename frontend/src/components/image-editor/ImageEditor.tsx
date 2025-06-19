import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { GridDimensions } from '../grid-item/GridItem';
import ImageToolbar from '../options-panel/ImageToolbar';
import './ImageEditor.css';

interface ImageEditorProps extends GridDimensions {
  id: string;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  id,
  gridWidth,
  gridHeight,
}) => {

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [previousCrop, setPreviousCrop] = useState<{ 
    crop: { x: number; y: number }; 
    zoom: number;
    croppedImage: string | null;
  } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null!);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    if (originalImage) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.src = originalImage;
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      
      if (ctx) {
        ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
        setCroppedImage(canvas.toDataURL('image/jpeg'));
      }
    }
  }, [originalImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        setOriginalImage(imageData);
        setCroppedImage(imageData); 
        onEditingChange?.(true); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGallerySelect = () => {
    // Implement gallery selection logic
    console.log('Gallery selection clicked');
  };

  const handleConfirm = () => {
    // Save the current crop state and cropped image as the new previous state
    setPreviousCrop({
      crop: { ...crop },
      zoom,
      croppedImage: croppedImage
    });
    onEditingChange?.(false);
  };

  const handleCancel = () => {
    if (previousCrop) {
      // Revert to the previous crop state and cropped image
      setCrop(previousCrop.crop);
      setZoom(previousCrop.zoom);
      setCroppedImage(previousCrop.croppedImage);
    } else {
      // If there's no previous state, revert to initial values
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedImage(originalImage);
    }
    onEditingChange?.(false);
  };

  // Update previousCrop when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setPreviousCrop({
        crop: { ...crop },
        zoom,
        croppedImage: croppedImage
      });
    }
  }, [isEditing, crop, zoom, croppedImage]);

  return (
    <div 
      className="image-editor" 
      style={{ width: gridWidth, height: gridHeight }}
    >
      {!originalImage ? (
          <div className="image-upload-options">
            <div className="upload-button-container">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="image-upload-input"
                id="image-upload"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              />
              <label 
                htmlFor="image-upload" 
                className="upload-button"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              >
                Upload Image
              </label>
            </div>
            <button 
              className="gallery-button"
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              Choose from Gallery
            </button>
          </div>

      ) : isEditing ? (
        <div className="crop-container" ref={editorRef}>
          <Cropper
            image={originalImage}
            crop={crop}
            zoom={zoom}
            aspect={gridWidth && gridHeight ? gridWidth / gridHeight : 4 / 3}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
          <ImageToolbar
            gridItemRef={editorRef}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="display-container">
          <img 
            src={croppedImage || ''} 
            alt="Cropped" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageEditor;

  