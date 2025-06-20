// EditableContainer.tsx
import React, { useState, useEffect, useRef } from 'react';
import './GridItem.css';
import OptionsPanel from '../options-panel/OptionsPanel';
import { useEditorStore } from '../../events/EditorStore';
import { useButtonHover } from '../../hooks/useButtonHover';


export interface GridDimensions {
  gridWidth?: number;
  gridHeight?: number;
}

interface GridItemProps {
  id: string;
  children: React.ReactElement<GridDimensions>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const GridItem: React.FC<GridItemProps> = ({
  id,
  children,
  onMouseEnter,
  onMouseLeave
}) => {

  const [isHovered, setIsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null!);
  const { isHovered: isButtonHovered, handleMouseEnter, handleMouseLeave } = useButtonHover();

  const activeEditor = useEditorStore(state => state.activeEditor);
  const isEditing = activeEditor === id;
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const deleteItem = useEditorStore(state => state.deleteItem);

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
        setActiveEditor(null);
        onMouseLeave?.();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isEditing, setActiveEditor, onMouseLeave]);

  return (
    <>
      <div 
        ref={containerRef}
        className="grid-item"
        data-item-id={id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="content-area">
          {React.cloneElement(children as React.ReactElement<GridDimensions>, {
            gridWidth: dimensions.width,
            gridHeight: dimensions.height
          })}    
        </div>
        {isHovered && !isEditing && (

          <button 
            className="options-toggle-btn"
            onClick={(e) => {
              setActiveEditor(id);
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            Options
          </button>
        )}
      </div>
      {isEditing && (
        <OptionsPanel
          id={id} 
          parentRef={containerRef}
        />
      )}
        

    </>
  );
};

export default GridItem;