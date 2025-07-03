// EditableContainer.tsx
import React, { useState, useEffect, useRef, use } from 'react';
import './GridItem.css';
import OptionsPanel from '../options-panel/OptionsPanel';
import { useEditorStore } from '../../../../global-state/EditorStore';

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

  const setActiveOptionsPanel = useEditorStore(state => state.setActiveOptionsPanel);
  const activeOptionsPanel = useEditorStore(state => state.activeOptionsPanel);

  const activeEditor = useEditorStore(state => state.activeEditor);
  const isEditing = activeEditor === id;
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);

  const mode = useEditorStore(state => state.mode);

  // Gets the dimensions of the grid item on change
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);


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
        {isHovered && (mode === 'edit') && !isEditing && !(activeOptionsPanel === id) && (

          <button 
            className="options-toggle-btn"
            onClick={(e) => {
              setActiveOptionsPanel(id);
            }}
            onMouseEnter={() => {setButtonHoveredState(true)}}
            onMouseLeave={() => {setButtonHoveredState(false)}}
          >
            Options
          </button>
        )}
      </div>
      {(activeOptionsPanel === id) && (
        <OptionsPanel
          id={id} 
          parentRef={containerRef}
        />
      )}
        

    </>
  );
};

export default GridItem;