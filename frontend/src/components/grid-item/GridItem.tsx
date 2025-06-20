// EditableContainer.tsx
import React, { useState, useEffect, useRef } from 'react';
import './GridItem.css';
import OptionsPanel from '../options-panel/OptionsPanel';
import { useEditorStore } from '../../events/EditorStore';

export interface GridDimensions {
  gridWidth?: number;
  gridHeight?: number;
}

interface GridItemProps {
  id: string;
  children: React.ReactElement<GridDimensions>;
}

const GridItem: React.FC<GridItemProps> = ({
  id,
  children,
}) => {

  const [isHovered, setIsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null!);

  const setButtonHoveredState = useEditorStore(state => state.setButtonHoveredState);
  const buttonHovered = useEditorStore(state => state.buttonHovered);


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
        setButtonHoveredState(false);
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isEditing, setActiveEditor, buttonHovered]);

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
            onMouseEnter={() => {setButtonHoveredState(true)}}
            onMouseLeave={() => {setButtonHoveredState(false)}}
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