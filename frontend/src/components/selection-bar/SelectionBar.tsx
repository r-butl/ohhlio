// frontend/src/components/selection-bar/SelectionBar.tsx
import React from 'react';
import './SelectionBar.css';
import { useEditorStore } from "../../events/EditorStore";

interface SelectionBarProps {}

const SelectionBar: React.FC<SelectionBarProps> = () => {
  const mode = useEditorStore(state => state.mode);
  const addItem = useEditorStore(state => state.addItem);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);


  return (
    <div className={`selection-bar ${mode === 'edit' ? 'open' : ''}`}> 
      <div className="selection-content">        
        <div className="selection-options">
          <button
            className="option-button undo"
            onClick={() => undo()}
          >
            Undo
          </button>
          <button
            className="option-button redo"
            onClick={() => redo()}
          >
            Redo
          </button>
          <button 
            className="option-button text"
            onClick={() => addItem('text')}
          >
            <span className="icon">📝</span>
          </button>

          <button 
            className="option-button image"
            onClick={() => addItem('image')}
          >
            <span className="icon">📤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionBar;