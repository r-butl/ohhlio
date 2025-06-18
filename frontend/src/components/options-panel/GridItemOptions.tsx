import React, { useState, useEffect } from 'react';
import './GridItemOptions.css';

interface GridItemOptionsProps {
  isEditable: boolean;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
  onDelete: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  contentType?: 'text' | 'image';
}

const GridItemOptions: React.FC<GridItemOptionsProps> = ({
  isEditable,
  isEditing,
  onEditingChange,
  onDelete,
  onMouseEnter,
  onMouseLeave,
  contentType
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isOptionsHovered, setIsOptionsHovered] = useState(false);

  const handleOptionsMouseEnter = () => {
    setIsOptionsHovered(true);
    onMouseEnter?.();
  };

  const handleOptionsMouseLeave = () => {
    setIsOptionsHovered(false);
    onMouseLeave?.();
    setIsOptionsOpen(false);
  };

  const toggleEditMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditingChange(!isEditing);
  };

  if (!isEditable || isEditing) return null;

  return (
    <div 
        className="options-container"
        onMouseEnter={handleOptionsMouseEnter}
        onMouseLeave={handleOptionsMouseLeave}
    >
      {!isOptionsOpen && (
        <button 
          className="options-toggle-btn"
          onClick={(e) => {
            setIsOptionsOpen(true);
          }}
          onMouseEnter={handleOptionsMouseEnter}
          onMouseLeave={handleOptionsMouseLeave}
        >
          Options
        </button>
      )}
      <div 
        className={`options-panel ${isOptionsOpen ? 'open' : ''}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {isEditable &&
            <button
            className="edit-toggle-button"
            onClick={toggleEditMode}
            >
            Edit
            </button>
        }
        <button
          className="delete-button"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default GridItemOptions; 