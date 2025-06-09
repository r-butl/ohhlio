import React from 'react';

interface OptionsPanelProps {
  itemId: string;
  isOpen: boolean;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
  showEditButton?: boolean;
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  itemId,
  isOpen,
  onToggle,
  onDelete,
  onEdit,
  showEditButton = false
}) => {
  return (
    <div className="grid-item-options">
      <button 
        className="options-toggle-btn"
        onClick={() => onToggle(itemId)}
      >
        Options
      </button>
      {isOpen && (
        <div className="options-panel">
          {showEditButton && onEdit && (
            <button onClick={() => onEdit(itemId)}>Edit</button>
          )}
          <button onClick={() => onDelete(itemId)}>Delete</button>
        </div>
      )}
    </div>
  );
}; 