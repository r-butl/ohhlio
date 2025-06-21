import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { GridDimensions } from '../grid-item/GridItem';
import { useEditorStore, ImageItemProps } from '../../events/EditorStore';
import emitter from '../../events/EventBus';
import './ImageEditor.css';
import { useEditor } from '@tiptap/react';

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
  const setActiveOptionsPanel = useEditorStore(state => state.setActiveEditor);
  const setItems = useEditorStore(state => state.setItems);
  
  // Get item data from store
  const item = useEditorStore(state => state.items[id]);
  
  // Provide default values if item doesn't exist or props are incomplete
  const defaultImageProps: ImageItemProps = {
    originalImage: null,
    croppedImage: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    aspectRatio: gridWidth && gridHeight ? gridWidth / gridHeight : 4 / 3
  };
  
  const imageProps: ImageItemProps = item?.props ? {
    ...defaultImageProps,
    ...item.props
  } : defaultImageProps;

  // Local state for editing (will be saved to store on confirm)
  const [localCrop, setLocalCrop] = useState(imageProps.crop);
  const [localZoom, setLocalZoom] = useState(imageProps.zoom);
  const [localOriginalImage, setLocalOriginalImage] = useState(imageProps.originalImage);
  const [localCroppedImage, setLocalCroppedImage] = useState(imageProps.croppedImage);
  
  const editorRef = useRef<HTMLDivElement>(null!);

  // Update local state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setLocalCrop(imageProps.crop);
      setLocalZoom(imageProps.zoom);
      setLocalOriginalImage(imageProps.originalImage);
      setLocalCroppedImage(imageProps.croppedImage);
    }
  }, [isEditing, imageProps]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    if (localOriginalImage) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.src = localOriginalImage;
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
        setLocalCroppedImage(canvas.toDataURL('image/jpeg'));
      }
    }
  }, [localOriginalImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        setLocalOriginalImage(imageData);
        setLocalCroppedImage(imageData);
        
        // Save to store immediately when image is uploaded
        setItems(draft => {
          if (draft[id]) {
            draft[id].props = {
              ...draft[id].props,
              originalImage: imageData,
              croppedImage: imageData,
              crop: { x: 0, y: 0 },
              zoom: 1,
              aspectRatio: gridWidth && gridHeight ? gridWidth / gridHeight : 4 / 3
            };
          }
        });

      };
      reader.readAsDataURL(file);


    }
  };

  const handleGallerySelect = () => {
    // Implement gallery selection logic
    console.log('Gallery selection clicked');
  };

  // Listen for confirm/cancel events
  useEffect(() => {
    const handleConfirm = ({ id: editId }: { id: string }) => {
      if (editId === id) {
        console.log('Confirm pressed - saving image data');
        setItems(draft => {
          if (draft[id]) {
            draft[id].props = {
              ...draft[id].props,
              originalImage: localOriginalImage,
              croppedImage: localCroppedImage,
              crop: localCrop,
              zoom: localZoom,
              aspectRatio: gridWidth && gridHeight ? gridWidth / gridHeight : 4 / 3
            };
          }
        });
      }
    };

    const handleCancel = () => {
      console.log('Cancel pressed - resetting image data');
      setLocalCrop(imageProps.crop);
      setLocalZoom(imageProps.zoom);
      setLocalOriginalImage(imageProps.originalImage);
      setLocalCroppedImage(imageProps.croppedImage);
    };

    emitter.on('confirm-edit', handleConfirm);
    emitter.on('cancel-edit', handleCancel);

    return () => {
      emitter.off('confirm-edit', handleConfirm);
      emitter.off('cancel-edit', handleCancel);
    };
  }, [id, localCrop, localZoom, localOriginalImage, localCroppedImage, imageProps, setItems, gridWidth, gridHeight]);

  return (
    <div 
      className="image-editor" 
      style={{ width: gridWidth, height: gridHeight }}
    >
      {!localOriginalImage ? (
        <div className="image-upload-options">
          <div className="upload-button-container">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="image-upload-input"
              id={`image-upload-${id}`}
              onMouseEnter={() => setButtonHoveredState(true)}
              onMouseLeave={() => setButtonHoveredState(false)}
            />
            <label 
              htmlFor={`image-upload-${id}`}
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
            image={localOriginalImage}
            crop={localCrop}
            zoom={localZoom}
            aspect={imageProps.aspectRatio}
            onCropChange={setLocalCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setLocalZoom}
          />
        </div>
      ) : (
        <div className="display-container">
          <img 
            src={localCroppedImage || ''} 
            alt="Cropped" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageEditor;

  