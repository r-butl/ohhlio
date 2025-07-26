import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import { GridDimensions } from '../grid-item/GridItem';
import { useEditorStore, ImageItemProps } from '../../context/EditorStore';
import emitter from '../../global-state/EventBus';
import { applyCropToImage } from '../../utils/imageUtils';
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
  const setActiveOptionsPanel = useEditorStore(state => state.setActiveOptionsPanel);
  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);
  
  // Get item data from store
  const item = useEditorStore(state => state.items[id]);
  
  // Memoize the aspect ratio calculation to prevent infinite re-renders
  const currentAspectRatio = useMemo(() => {
    return gridWidth && gridHeight ? gridWidth / gridHeight : 4 / 3;
  }, [gridWidth, gridHeight]);
  
  // Provide default values if item doesn't exist or props are incomplete
  const defaultImageProps: ImageItemProps = useMemo(() => ({
    assetId: null,
    originalImage: null,
    croppedImage: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    aspectRatio: currentAspectRatio
  }), [currentAspectRatio]);

  const imageProps: ImageItemProps = useMemo(() => {
    return item?.props ? {
      ...defaultImageProps,
      ...item.props
    } : defaultImageProps;
  }, [item?.props, defaultImageProps]);

  // Local state for editing (will be saved to store on confirm)
  const [localCrop, setLocalCrop] = useState(imageProps.crop);
  const [localZoom, setLocalZoom] = useState(imageProps.zoom);
  const [localOriginalImage, setLocalOriginalImage] = useState(imageProps.originalImage);
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null!);

  // Update local state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setLocalCrop({ x: 0, y: 0 }); // Reset crop position to center
      setLocalZoom(imageProps.zoom);
      setLocalOriginalImage(imageProps.originalImage);
    }
  }, [isEditing, imageProps.zoom, imageProps.originalImage]);

  // Sync local state with store props when assets are loaded
  useEffect(() => {
    setLocalOriginalImage(imageProps.originalImage);
    setDisplayImage(imageProps.originalImage);
  }, [imageProps.originalImage]);

  // Apply crop settings to original image when needed
  const applyCropSettings = useCallback(async () => {
    if (imageProps.originalImage && imageProps.cropSettings) {
      try {
        const croppedImage = await applyCropToImage(
          imageProps.originalImage,
          imageProps.cropSettings
        );
        setDisplayImage(croppedImage);
      } catch (error) {
        console.error('Failed to apply crop settings:', error);
        setDisplayImage(imageProps.originalImage);
      }
    } else if (imageProps.originalImage) {
      // If no crop settings, just set the original image
      setDisplayImage(imageProps.originalImage);
    }
  }, [imageProps.originalImage, imageProps.cropSettings]);

  // Apply crop settings when original image or crop settings change
  useEffect(() => {
    applyCropSettings();
  }, [applyCropSettings]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    console.log('Crop complete:', { croppedArea, croppedAreaPixels });
    
    if (localOriginalImage) {
      // Save crop settings for later application
      setItemsWithHistory(draft => {
        if (draft[id]) {
          draft[id].props.cropSettings = {
            x: croppedAreaPixels.x,
            y: croppedAreaPixels.y,
            width: croppedAreaPixels.width,
            height: croppedAreaPixels.height,
            zoom: localZoom
          };
        }
      });
    }
  }, [localOriginalImage, localZoom, setItemsWithHistory, id]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        setLocalOriginalImage(imageData);
        
        // Save to store immediately when image is uploaded
        setItemsWithHistory(draft => {
          if (draft[id]) {
            draft[id].props = {
              ...draft[id].props,
              originalImage: imageData,
              crop: { x: 0, y: 0 },
              zoom: 1,
              aspectRatio: currentAspectRatio
            };
          }
        });
      };
      reader.readAsDataURL(file);

      // Set this component as the active editor
      // setActiveOptionsPanel(id);
      // setActiveEditor(id);
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
        setItemsWithHistory(draft => {
          if (draft[id]) {
            draft[id].props = {
              ...draft[id].props,
              originalImage: localOriginalImage,
              crop: localCrop,
              zoom: localZoom,
              aspectRatio: currentAspectRatio
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
    };

    emitter.on('confirm-edit', handleConfirm);
    emitter.on('cancel-edit', handleCancel);

    return () => {
      emitter.off('confirm-edit', handleConfirm);
      emitter.off('cancel-edit', handleCancel);
    };
  }, [id, localCrop, localZoom, localOriginalImage, imageProps, setItemsWithHistory, currentAspectRatio]);

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
            aspect={currentAspectRatio}
            onCropChange={(crop) => {
              console.log('Crop change:', crop);
              setLocalCrop(crop);
            }}
            onCropComplete={onCropComplete}
            onZoomChange={(zoom) => {
              console.log('Zoom change:', zoom);
              setLocalZoom(zoom);
            }}
          />
        </div>
      ) : (
        <div className="display-container">
          <img 
            src={displayImage || localOriginalImage || ''} 
            alt="Cropped" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageEditor;

  