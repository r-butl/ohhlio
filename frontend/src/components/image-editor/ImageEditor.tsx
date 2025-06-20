import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { GridDimensions } from '../grid-item/GridItem';
import { useEditorStore } from '../../events/EditorStore';
import './ImageEditor.css';

interface ImageEditorProps extends GridDimensions {
  id: string;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  id,
  gridWidth,
  gridHeight,
}) => {

  // EditorStore stuff
  const isEditing = useEditorStore(state => state.activeEditor === id);
  const setButtonHoveredState = useEditorStore(state => state.setButtonHoveredState);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);

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
      };
      reader.readAsDataURL(file);

      setActiveEditor(id);
    }
  };

  const handleGallerySelect = () => {
    // Implement gallery selection logic
    console.log('Gallery selection clicked');
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
                onMouseEnter={() => setButtonHoveredState(true)}
                onMouseLeave={() => setButtonHoveredState(false)}
              />
              <label 
                htmlFor="image-upload" 
                className="upload-button"
                onMouseEnter={() => setButtonHoveredState(true)}
                onMouseLeave={() => setButtonHoveredState(false)}
              >
                Upload Image
              </label>
            </div>
            <button 
              className="gallery-button"
              onMouseEnter={() => setButtonHoveredState(true)}
              onMouseLeave={() => setButtonHoveredState(false)}
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

  