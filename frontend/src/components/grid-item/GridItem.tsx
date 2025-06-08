// EditableContainer.tsx
import React, { useState } from 'react';
import './GridItem.css';
import GridItemOptions from './GriditemOptions'; 

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

  const [ isOptionsOpen, setIsOptionsOpen ] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const toggleEditMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditingChange?.(!isEditing);
  };

  const handleMouseEnter = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsOptionsOpen(true);
  };
  
  const handleMouseLeave = () => {
    const id = setTimeout(() => {
      setIsOptionsOpen(false);
    }, 100);
    setTimeoutId(id);
  };
  
  return (
    <div 
      className="grid-item"
      onMouseLeave={handleMouseLeave}  // Add mouse leave to the entire grid item
    >
      <div className="content-area">
        {children}
      </div>
      {isEditable && !isOptionsOpen && (
        <div
          className="hover-area"
          onMouseEnter={handleMouseEnter}
        />
      )}

      {
        isEditable && (
          <GridItemOptions
            isOpen={isOptionsOpen}
            onOpenChange={setIsOptionsOpen}
            className="grid-item-options"
          >
            <button
              className="edit-toggle-button"
              onClick={() => onEditingChange?.(!isEditing)}
            >
              edit
            </button>
          </GridItemOptions>
      )}
    </div>
  );
};

export default GridItem;