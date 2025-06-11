import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { GridDimensions } from '../grid-item/GridItem';
import './ImageEditor.css';

interface ImageEditorProps extends GridDimensions {
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  isEditing = false,
  onEditingChange,
  gridWidth,
  gridHeight
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [image, setImage] = useState<string | null>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    console.log(croppedArea, croppedAreaPixels);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGallerySelect = () => {
    // Implement gallery selection logic
    console.log('Gallery selection clicked');
  };

  return (
    <div className="image-editor" style={{ width: gridWidth, height: gridHeight }}>
      {!image ? (
        <div className="image-upload-options">
          <div className="upload-button-container">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="image-upload-input"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="upload-button">
              Upload Image
            </label>
          </div>
          <button 
            className="gallery-button"
            onClick={handleGallerySelect}
          >
            Choose from Gallery
          </button>
        </div>
      ) : (
        <div className="crop-container">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={gridWidth && gridHeight ? gridWidth / gridHeight : 4 / 3}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
      )}
    </div>
  );
};

export default ImageEditor;

  