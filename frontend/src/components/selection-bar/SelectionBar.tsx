// frontend/src/components/SelectionBar/SelectionBar.tsx
import React from 'react';
import './SelectionBar.css';

interface SelectionBarProps {
  isOpen: boolean;
  onAddText: () => void;
  onAddImage: (type: 'upload' | 'gallery') => void;
}

const SelectionBar: React.FC<SelectionBarProps> = ({
  isOpen,
  onAddText,
  onAddImage
}) => {
  return (
    <div className={`selection-bar ${isOpen ? 'open' : ''}`}> 
      <div className="selection-content">        
        <div className="selection-options">
          <button 
            className="option-button"
            onClick={onAddText}
          >
            <span className="icon">📝</span>
          </button>

          <button 
            className="option-button"
            onClick={() => onAddImage('upload')}
          >
            <span className="icon">📤</span>
          </button>

          <button 
            className="option-button"
            onClick={() => onAddImage('gallery')}
          >
            <span className="icon">🖼️</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionBar;