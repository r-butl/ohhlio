// GridItemOptions.tsx
import React from 'react';
import './GridItemOptions.css';

interface GridItemOptionsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className: string
}

const GridItemOptions: React.FC<GridItemOptionsProps> = ({ 
  isOpen,
  onOpenChange,
  children
 }) => {
  return (
    <div className={`grid-item-options ${isOpen ? 'open' : ''} `}>
      <div className="options-content">
        {children}
      </div>
    </div>
  );
};

export default GridItemOptions;