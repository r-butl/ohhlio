import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import { GridDimensions } from '../grid-item/GridItem';
import { useEditorStore, ImageItemProps } from '../../context/EditorStore';
import emitter from '../../global-state/EventBus';
import { applyCropToImage } from '../../utils/imageUtils';
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
      {isEditing ? (
        <div className="crop-container" ref={editorRef}>
          <Cropper
            image={localOriginalImage || undefined}
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

  