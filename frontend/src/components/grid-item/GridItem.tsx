// EditableContainer.tsx
import React, { useState } from 'react';
import './GridItem.css';

interface GridItemProps {
  isEditable?: boolean;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  children: React.ReactNode;
}

const GridItem: React.FC<GridItemProps> = ({
  isEditable = true,
  isEditing = false,
  onEditingChange,
  children
}) => {
  const toggleEditMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditingChange?.(!isEditing);
  };

  return (
    <div className="grid-item">
      {isEditable && (
        <button
          className="edit-button"
          onClick={toggleEditMode}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isEditing ? '✓' : '✎'}
        </button>
      )}
      {children}
    </div>
  );
};

export default GridItem;