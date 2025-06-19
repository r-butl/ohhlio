import React, { useState, useEffect } from 'react';
import './GridItemOptions.css';
import { useEditorStore } from '../../events/EditorStore';

interface GridItemOptionsProps {
  id: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const GridItemOptions: React.FC<GridItemOptionsProps> = ({
  id,
  onMouseEnter,
  onMouseLeave
}) => {

  const isEditable = useEditorStore(state => state.mode === 'edit');
  const isEditing = useEditorStore(state => state.activeEditor === id);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);

  const toggleEditorMode = useEditorStore(state => state.toggleEditorMode);
  const deleteItem = useEditorStore(state => state.deleteItem);

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
            onClick={() => setActiveEditor(id)}
            >
            Edit
            </button>
        }
        <button
          className="delete-button"
          onClick={() => deleteItem(id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default GridItemOptions; 