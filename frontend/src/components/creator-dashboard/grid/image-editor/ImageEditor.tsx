import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GridDimensions } from '../grid-item/GridItem';
import { useEditorStore } from '@/context/EditorStore';
import { ImageProps } from '@/interfaces/ProjectItemsInterfaces';
import emitter from '@/global-state/EventBus';
import './ImageEditor.css';
import AssetPlaceholder from '@/components/ui/AssetPlaceholder';

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
  
  // Provide default values if item doesn't exist or props are incomplete.
  // aspectRatio defaults to 4/3 for new items; the locked ratio is set by
  // EditorGrid's onResizeStop handler, not here.
  const defaultImageProps: ImageProps = useMemo(() => ({
    assetId: null,
    originalImage: null,
    zoom: 1,
    aspectRatio: 4 / 3
  }), []);

  const storedImageProps = item?.type === 'image' ? item.props : undefined;

  const imageProps: ImageProps = useMemo(() => {
    return storedImageProps ? {
      ...defaultImageProps,
      ...storedImageProps
    } : defaultImageProps;
  }, [storedImageProps, defaultImageProps]);

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
          const draftItem = draft[id];
          if (draftItem && draftItem.type === 'image') {
            draftItem.props = {
              ...draftItem.props,
              originalImage: localOriginalImage,
              zoom: localZoom
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
  }, [id, localZoom, localOriginalImage, imageProps, setItemsWithHistory]);

  const loadingAssets = useEditorStore(state => state.isLoadingAssets);

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
            <AssetPlaceholder label={loadingAssets ? 'Loading image...' : 'No image selected'} />
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
            <AssetPlaceholder label={'Loading image...'} />
          )}
        </div>
      )}
    </div>
  );
};

export default ImageEditor;

  