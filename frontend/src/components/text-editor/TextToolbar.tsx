import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './TextToolbar.css';

interface TextToolbarProps {
  gridItemRef: React.RefObject<HTMLDivElement>;
  onConfirm: () => void;
  onCancel: () => void;
  fontFamily: string;
  fontSize: number;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  alignment: string;
}

const TextToolbarPortal: React.FC<TextToolbarProps> = ({
    fontFamily,
    fontSize,
    onFontFamilyChange,
    onFontSizeChange,
    gridItemRef,
    onConfirm,
    onCancel,
    onBold,
    onItalic,
    onUnderline,
    isBold,
    isItalic,
    isUnderline,
    onAlignLeft,
    onAlignCenter,
    onAlignRight,
    alignment
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
        
        <div className="button-group">
          <label>Text Formatting</label>
          <div className='format-buttons'>
            <button 
            onClick={onBold} 
            className={`format-button ${isBold ? 'active' : ''}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button 
            onClick={onItalic} 
            className={`format-button ${isItalic ? 'active' : ''}`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button 
            onClick={onUnderline} 
            className={`format-button ${isUnderline ? 'active' : ''}`}
            title="Underline"
          >
            <u>U</u>
          </button>
        </div>

        </div>
        <div className="button-group">
          <label>Alignment</label>
          <div className='format-buttons'>

            <button 
              onClick={onAlignLeft} 
              className={`format-button ${alignment === 'left' ? 'active' : ''}`}
              title="Align Left"
            >
              ⇤
            </button>
            <button 
              onClick={onAlignCenter} 
              className={`format-button ${alignment === 'center' ? 'active' : ''}`}
              title="Align Center"
            >
              ⇔
            </button>
            <button 
              onClick={onAlignRight} 
              className={`format-button ${alignment === 'right' ? 'active' : ''}`}
              title="Align Right"
            >
              ⇥
            </button>
          </div>
        </div>
        
        <div className="toolbar-group">
          <button onClick={onConfirm} className="confirm-button">✓</button>
          <button onClick={onCancel} className="cancel-button">✕</button>
        </div>
      </div>,
      document.getElementById('portal-root') || document.body
    );
  };

export default TextToolbarPortal;