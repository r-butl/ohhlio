// EditableContainer.tsx
import React, { useState, useEffect, useRef } from 'react';
import './GridItem.css';
import GridItemOptions from './GridItemOptions';

export interface GridDimensions {
  gridWidth?: number;
  gridHeight?: number;
}

interface GridItemProps {
  isEditable?: boolean;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  onButtonHoverChange?: (isHovered: boolean) => void;
  onDelete?: () => void;
  children: React.ReactElement<GridDimensions>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const GridItem: React.FC<GridItemProps> = ({
  isEditable = true,
  isEditing = false,
  onEditingChange,
  onButtonHoverChange,
  onDelete,
  children,
  onMouseEnter,
  onMouseLeave
}) => {
  const [isHovered, setIsHovered] = useState(false);
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

  // Allows the usage of the escape key to leave the editing mode
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditing) {
        onEditingChange?.(false);
        onMouseLeave?.();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isEditing, onEditingChange]);

  return (
    <div 
      ref={containerRef}
      className="grid-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="content-area">
        {React.cloneElement(children as React.ReactElement, {
          gridWidth: dimensions.width,
          gridHeight: dimensions.height
        })}    
      </div>
      {isHovered && !isEditing && (
        <GridItemOptions
          isEditable={isEditable}
          isEditing={isEditing}
          onEditingChange={onEditingChange}
          onButtonHoverChange={onButtonHoverChange}
          onDelete={onDelete}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      )}
    </div>
  );
};

export default GridItem;