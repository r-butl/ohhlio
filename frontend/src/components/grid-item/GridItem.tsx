// EditableContainer.tsx
import React, { useState } from 'react';
import './GridItem.css';

interface GridItemProps {
  isEditable?: boolean;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  children: React.ReactNode;
}

const EditableContainer: React.FC<GridItemProps> = ({
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
    <div className="editable-container">
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

export default EditableContainer;