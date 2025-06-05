import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './FloatingToolbar.css';

const FloatingToolbarPortal: React.FC<{
    fontFamily: string;
    fontSize: number;
    onFontFamilyChange: (font: string) => void;
    onFontSizeChange: (size: number) => void;
  }> = ({ fontFamily, fontSize, onFontFamilyChange, onFontSizeChange }) => {
    const fontFamilies = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Courier New'];

    console.log('Floating tool bar toggled');
  
    return createPortal(
      <div className="floating-toolbar">
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
      </div>,
      document.getElementById('portal-root') || document.body
    );
  };

export default FloatingToolbarPortal;