// frontend/src/components/TextEditor/TextEditor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import './TextEditor.css';

const FloatingToolbarPortal: React.FC<{
  fontFamily: string;
  fontSize: number;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
}> = ({ 
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange
}) => {
  const fontFamilies = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Courier New'];

  return createPortal(
    <div className="floating-toolbar">
      <div className="toolbar-group">
        <label>Font</label>
        <select 
          value={fontFamily} 
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="font-family-select"
        >
          {fontFamilies.map(font => (
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
          {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
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

interface TextEditorProps {
  initialText?: string;
  initialFontSize?: number;
  initialFontFamily?: string;
  isEditable?: boolean;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({
  initialText = 'Click to edit',
  initialFontSize = 16,
  initialFontFamily = 'Arial',
  isEditable = true,
  isEditing = false,
  onEditingChange,
}) => {
  const [text, setText] = useState(initialText);
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0});

  const toggleEditMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newEditingState = !isEditing;
    console.log('Toggling edit mode:', {
      previousState: isEditing,
      newState: newEditingState
  });
    onEditingChange?.(newEditingState);
  };

  return (
    <div ref={editorRef} className="text-editor">
      {isEditable && (
        <button 
          className="edit-button"
          onClick={toggleEditMode}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isEditing ? '✓' : '✎'}
        </button>
      )}
      
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            fontFamily,
            fontSize: `${fontSize}px`
          }}
          className="text-editor-textarea"
          autoFocus
        />
      ) : (
        <p style={{
          fontFamily,
          fontSize: `${fontSize}px`
        }}>
          {text}
        </p>
      )}

      {isEditing && (
        <FloatingToolbarPortal
        fontFamily={fontFamily}
        fontSize={fontSize}
        onFontFamilyChange={setFontFamily}
        onFontSizeChange={setFontSize}
      />
      )}

    </div>
  );
};

export default TextEditor;