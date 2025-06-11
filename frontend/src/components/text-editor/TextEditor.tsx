import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import './TextEditor.css';
import FloatingToolbarPortal from './FloatingToolbar';
import { GridDimensions } from '../grid-item/GridItem';

interface TextEditorProps extends GridDimensions{
  initialFontSize?: number;
  initialFontFamily?: string;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({
  initialFontSize = 16,
  initialFontFamily = 'Arial',
  isEditing = false,
  gridWidth,
  gridHeight,
  onEditingChange
}) => {
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [maxChars, setMaxChars] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null!);

  const defaultMessage = '<p style="color: gray;">enter text</p>';

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: defaultMessage,
    editable: isEditing,
    editorProps: {
      attributes: {
        style: `font-family: ${fontFamily}; font-size: ${fontSize}px`,
      }
    },
    onUpdate: ({ editor }) => {
      const content = editor.getText();
      setCharCount(content.length);
    }
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

  // Calculate max characters based on grid size and font size
  useEffect(() => {
    if (gridWidth && gridHeight && fontSize) {
      // More conservative estimate that accounts for wider characters
      const charsPerLine = Math.floor(gridWidth / (fontSize * 0.7));
      const lines = Math.floor(gridHeight / (fontSize * 1.5));
      const maxChars = Math.floor(charsPerLine * lines * 0.8);
      setMaxChars(maxChars);
    }
  }, [gridHeight, gridWidth, fontSize]);

  const handleConfirm = () => {
    if (onEditingChange) {
      onEditingChange(false);
    }
  };

  const handleCancel = () => {
    // Implement cancel logic
  };

  const toggleBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  const toggleUnderline = () => {
    editor?.chain().focus().toggleUnderline().run();
  };

  const setAlignment = (alignment: 'left' | 'center' | 'right') => {
    editor?.chain().focus().setTextAlign(alignment).run();
  };

  return (
    <div ref={editorRef} className="text-editor">
      <EditorContent editor={editor} className="text-editor-tiptap" />
      {isEditing && (
        <>
          <FloatingToolbarPortal
            fontFamily={fontFamily}
            fontSize={fontSize}
            onFontFamilyChange={setFontFamily}
            onFontSizeChange={setFontSize}
            gridItemRef={editorRef}
            onConfirm={handleConfirm}
            onBold={toggleBold}
            onItalic={toggleItalic}
            onUnderline={toggleUnderline}
            isBold={editor?.isActive('bold') ?? false}
            isItalic={editor?.isActive('italic') ?? false}
            isUnderline={editor?.isActive('underline') ?? false}
            onAlignLeft={() => setAlignment('left')}
            onAlignCenter={() => setAlignment('center')}
            onAlignRight={() => setAlignment('right')}
            alignment={editor?.getAttributes('paragraph').textAlign || 'left'}
          />
          <div className={`char-count ${charCount > maxChars ? 'exceeded' : ''}`}>
            {charCount}/{maxChars}
          </div>
        </>
      )}
    </div>
  );
};

export default TextEditor;
