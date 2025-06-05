// frontend/src/components/TextEditor/TextEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import './TextEditor.css';

const FloatingToolbarPortal: React.FC<{
  fontFamily: string;
  fontSize: number;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
}> = ({ fontFamily, fontSize, onFontFamilyChange, onFontSizeChange }) => {
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

interface TextEditorProps {
  initialFontSize?: number;
  initialFontFamily?: string;
  isEditing?: boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({
  initialFontSize = 16,
  initialFontFamily = 'Arial',
  isEditing = false,
}) => {
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const editorRef = useRef<HTMLDivElement>(null);

  const defaultMessage = '<p style="color: gray;">enter text</p>';

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontFamily],
    content: defaultMessage,
    editable: isEditing,
    editorProps: {
      attributes: {
        style: `font-family: ${fontFamily}; font-size: ${fontSize}px;`,
      },
    },
  });

  // Controls font family updates
  useEffect(() => {
    if (editor && isEditing) {
      editor.chain().focus().setFontFamily(fontFamily).run();
    }
  }, [fontFamily, editor, isEditing]);

  // Controls font size updates
  useEffect(() => {
    if (editor && isEditing) {
      editor.chain().focus().setMark('textStyle', { fontSize: `${fontSize}px` }).run();
    }
  }, [fontSize, editor, isEditing]);

  // Activates editing capability
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  return (
    <div ref={editorRef} className="text-editor">
      <EditorContent editor={editor} className="text-editor-tiptap" />
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
