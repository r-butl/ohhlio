import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GridDimensions } from '../grid-item/GridItem';
import { useEditorStore, ImageItemProps } from '@/context/EditorStore';
import emitter from '@/global-state/EventBus';
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
  const item = useEditorStore(state => state.currentProject.items[id]);
  
  // Memoize the aspect ratio calculation to prevent infinite re-renders
  const currentAspectRatio = useMemo(() => {
    return gridWidth && gridHeight ? gridWidth / gridHeight : 4 / 3;
  }, [gridWidth, gridHeight]);
  
  // Provide default values if item doesn't exist or props are incomplete
  const defaultImageProps: ImageItemProps = useMemo(() => ({
    assetId: null,
    originalImage: null,
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
  const [localZoom, setLocalZoom] = useState(imageProps.zoom);
  const [localOriginalImage, setLocalOriginalImage] = useState(imageProps.originalImage);
  
  const editorRef = useRef<HTMLDivElement>(null!);

  // Update local state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setLocalZoom(imageProps.zoom);
      setLocalOriginalImage(imageProps.originalImage);
    }
  }, [isEditing, imageProps.zoom, imageProps.originalImage]);

  // Sync local state with store props when assets are loaded
  useEffect(() => {
    setLocalOriginalImage(imageProps.originalImage);
  }, [imageProps.originalImage]);

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
              zoom: localZoom,
              aspectRatio: currentAspectRatio
            };
          }
        });
      }
    };

    const handleCancel = () => {
      console.log('Cancel pressed - resetting image data');
      setLocalZoom(imageProps.zoom);
      setLocalOriginalImage(imageProps.originalImage);
    };

    emitter.on('confirm-edit', handleConfirm);
    emitter.on('cancel-edit', handleCancel);

    return () => {
      emitter.off('confirm-edit', handleConfirm);
      emitter.off('cancel-edit', handleCancel);
    };
  }, [id, localZoom, localOriginalImage, imageProps, setItemsWithHistory, currentAspectRatio]);

  return (
    <div 
      className="image-editor" 
      style={{ width: gridWidth, height: gridHeight }}
    >
      {isEditing ? (
        <div className="edit-container" ref={editorRef}>
          {localOriginalImage ? (
            <img 
              src={localOriginalImage} 
              alt="Editing" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transform: `scale(${localZoom})`
              }}
            />
          ) : (
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '14px'
              }}
            >
              No image selected
            </div>
          )}
        </div>
      ) : (
        <div className="display-container">
          {localOriginalImage ? (
            <img 
              src={localOriginalImage} 
              alt="Display" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '14px'
              }}
            >
              Loading image...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageEditor;

  