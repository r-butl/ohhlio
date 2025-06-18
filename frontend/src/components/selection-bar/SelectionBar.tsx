// frontend/src/components/SelectionBar/SelectionBar.tsx
import React from 'react';
import './SelectionBar.css';
import { useEditorStore } from "../../events/EditorStore";

interface SelectionBarProps {}

const SelectionBar: React.FC<SelectionBarProps> = () => {
  const mode = useEditorStore(state => state.mode);
  const addItem = useEditorStore(state => state.addItem);

  return (
    <div className={`selection-bar ${mode === 'edit' ? 'open' : ''}`}> 
      <div className="selection-content">        
        <div className="selection-options">
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