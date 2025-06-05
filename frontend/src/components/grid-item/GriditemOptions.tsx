// HoverOverlay.tsx
import React from 'react';
import './HoverOverlay.css';

interface GridItemOptionsProps {
  children: React.ReactNode;
}

const GridItemOptions: React.FC<GridItemOptionsProps> = ({ children }) => {
  return (
    <div className="hover-overlay">
      {children}
    </div>
  );
};

export default GridItemOptions;