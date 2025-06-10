// EditableContainer.tsx
import React, { useState, useEffect } from 'react';
import './GridItem.css';

interface GridItemProps {
  isEditable?: boolean;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  onOptionsHoverChange?: (isHovered: boolean) => void;
  onDelete?: () => void;
  children: React.ReactNode;
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
  
  return (
    <div 
      className="grid-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="content-area">
        {children}
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