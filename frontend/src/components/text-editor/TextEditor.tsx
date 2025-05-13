// frontend/src/components/TextEditor/TextEditor.tsx
import React, { useState, useEffect } from 'react';
import './TextEditor.css';

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
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [showToolbar, setShowToolbar] = useState(false);
  
  const fontFamilies = [
    'Arial',
    'Times New Roman',
    'Helvetica',
    'Georgia',
    'Courier New',
    'Verdana'
  ];

  useEffect(() => {
    setShowToolbar(isEditing);
  }, [isEditing]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontSize(Number(e.target.value));
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(e.target.value);
  };

  const toggleEditMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditingChange?.(!isEditing);
  };

  return (
    <div className="text-editor">
      {isEditable && (
        <button 
          className="edit-button"
          onClick={toggleEditMode}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isEditing ? '✓' : '✎'}
        </button>
      )}

      {showToolbar && (
        <div className="floating-toolbar">
          <div className="toolbar-group">
            <label>Font</label>
            <select 
              value={fontFamily} 
              onChange={handleFontFamilyChange}
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
              onChange={handleFontSizeChange}
              className="font-size-select"
            >
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {isEditing ? (
        <textarea
          value={text}
          onChange={handleTextChange}
          style={{ 
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily
          }}
          className="text-editor-textarea"
          autoFocus
        />
      ) : (
        <div
          style={{ 
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily
          }}
          className="text-editor-content"
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default TextEditor;