// frontend/src/components/SelectionBar/SelectionBar.tsx
import React from 'react';
import './SelectionBar.css';

interface SelectionBarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddText: () => void;
  onAddImage: (type: 'upload' | 'gallery') => void;
}

const SelectionBar: React.FC<SelectionBarProps> = ({
  isOpen,
  onClose,
  onAddText,
  onAddImage
}) => {
  return (
    <div className={`selection-bar ${isOpen ? 'open' : ''}`}>
      <button className="close-button" onClick={onClose}>×</button>
      
      <div className="selection-content">
        <h3>Add Content</h3>
        
        <div className="selection-options">
          <button 
            className="option-button"
            onClick={onAddText}
          >
            <span className="icon">📝</span>
            <span className="label">Text Block</span>
          </button>

          <button 
            className="option-button"
            onClick={() => onAddImage('upload')}
          >
            <span className="icon">📤</span>
            <span className="label">Upload Image</span>
          </button>

          <button 
            className="option-button"
            onClick={() => onAddImage('gallery')}
          >
            <span className="icon">🖼️</span>
            <span className="label">Image Gallery</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionBar;