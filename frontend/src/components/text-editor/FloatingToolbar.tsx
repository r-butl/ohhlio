import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './FloatingToolbar.css';

interface FloatingToolbarProps {
  fontFamily: string;
  fontSize: number;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  gridItemRef: React.RefObject<HTMLDivElement>;
  onConfirm: () => void;
}

const FloatingToolbarPortal: React.FC<FloatingToolbarProps> = ({
    fontFamily,
    fontSize,
    onFontFamilyChange,
    onFontSizeChange,
    gridItemRef,
    onConfirm,
  }) => {

    const [position, setPosition] = useState({ top: 0, left: 0 });
    const fontFamilies = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Courier New'];

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
      <div className="floating-toolbar" style={{ top: position.top, left: position.left, position: 'absolute' }}>
        <div className="toolbar-group">
          <label>Font</label>
          <select
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="font-family-select"
          >
            {fontFamilies.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-group">
          <label>Size</label>
          <select
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="font-size-select"
          >
            {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-group">
          <button onClick={onConfirm} className="confirm-button">✓</button>
        </div>
      </div>,
      document.getElementById('portal-root') || document.body
    );
  };

export default FloatingToolbarPortal;