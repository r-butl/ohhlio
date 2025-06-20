import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './OptionsPanel.css';

interface ImageToolbarProps {
  gridItemRef: React.RefObject<HTMLDivElement>;
  onConfirm: () => void;
  onCancel: () => void;
}

const ImageToolbar: React.FC<ImageToolbarProps> = ({
  gridItemRef,
  onConfirm,
  onCancel,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const gridItem = gridItemRef.current;
      if (gridItem) {
        const rect = gridItem.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY - 10,
          left: rect.left + window.scrollX + rect.width - 200,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [gridItemRef]);

  return createPortal(
    <div className="image-toolbar" style={{ top: position.top, left: position.left, position: 'absolute' }}>
      <div className="toolbar-buttons">
        <button onClick={onConfirm} className="confirm-button">✓</button>
        <button onClick={onCancel} className="cancel-button">✕</button>
      </div>
    </div>,
    document.getElementById('portal-root') || document.body
  );
};

export default ImageToolbar;
