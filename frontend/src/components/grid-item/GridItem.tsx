// EditableContainer.tsx
import React, { useState, useEffect, useRef } from 'react';
import './GridItem.css';

export interface GridDimensions {
  gridWidth?: number;
  gridHeight?: number;
}

interface GridItemProps {
  isEditable?: boolean;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  onOptionsHoverChange?: (isHovered: boolean) => void;
  onDelete?: () => void;
  children: React.ReactElement<GridDimensions>;
}

const GridItem: React.FC<GridItemProps> = ({
  isEditable = true,
  isEditing = false,
  onEditingChange,
  onOptionsHoverChange,
  onDelete,
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isOptionsHovered, setIsOptionsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null!);

  // Gets the dimensions of the grid item on change
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isOptionsHovered) {
      setIsOptionsOpen(false);
      onOptionsHoverChange?.(false);
    }
  };

  const handleOptionsMouseEnter = () => {
    setIsOptionsHovered(true);
    onOptionsHoverChange?.(true);
  };

  const handleOptionsMouseLeave = () => {
    setIsOptionsHovered(false);
    onOptionsHoverChange?.(false);
    setIsOptionsOpen(false);
  };

  const toggleOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOptionsOpen(!isOptionsOpen);
    onOptionsHoverChange?.(!isOptionsOpen);
  };

  const toggleEditMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditingChange?.(!isEditing);
  };

  // Allows the usage of the escape key to leave the editing mode
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditing) {
        onEditingChange?.(false);
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isEditing, onEditingChange]);

  // resets the hover state and options panel when the floating tool bar is exited.
  useEffect(() => {
    if (!isEditing) {
      setIsHovered(false);
      setIsOptionsOpen(false);
      setIsOptionsHovered(false);
      onOptionsHoverChange?.(false);
    }
  }, [isEditing, onOptionsHoverChange]);
  
  return (
    <div 
      ref={containerRef}
      className="grid-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="content-area">
      {React.cloneElement(children as React.ReactElement, {
        gridWidth: dimensions.width,
        gridHeight: dimensions.height
      })}    
      </div>
      {isEditable && isHovered && !isEditing && (
        <div className="options-container">
          {!isOptionsOpen && <button 
            className="options-toggle-btn"
            onClick={toggleOptions}
            onMouseEnter={handleOptionsMouseEnter}
            onMouseLeave={handleOptionsMouseLeave}
          >
            Options
          </button>
          }
          <div 
            className={`options-panel ${isOptionsOpen ? 'open' : ''}`}
            onMouseEnter={handleOptionsMouseEnter}
            onMouseLeave={handleOptionsMouseLeave}
          >
            <button
              className="edit-toggle-button"
              onClick={toggleEditMode}
            >
              Edit
            </button>
            <button
              className="delete-button"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GridItem;