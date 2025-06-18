import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import './TextEditor.css';
import TextToolbarPortal from '../options-panel/TextToolbar';
import { GridDimensions } from '../grid-item/GridItem';

interface TextEditorProps extends GridDimensions {
  initialFontSize?: number;
  initialFontFamily?: string;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const TextEditor: React.FC<TextEditorProps> = ({
  initialFontSize = 16,
  initialFontFamily = 'Arial',
  gridWidth,
  gridHeight,  
  isEditing = false,
  onEditingChange,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [maxChars, setMaxChars] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const DEFAULT_MESSAGE = "Select <strong>Options &gt; Edit</strong> to add text.";
  const [savedContent, setSavedContent] = useState(DEFAULT_MESSAGE);
  const editorRef = useRef<HTMLDivElement>(null!);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'listItem', 'bulletList', 'orderedList'],
        defaultAlignment: 'center',
        alignments: ['left', 'center', 'right']
      }),
    ],
    content: savedContent,
    editable: isEditing,
    editorProps: {
      attributes: {
        style: `font-family: ${fontFamily}; font-size: ${fontSize}px`,
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          const editorEl = view.dom as HTMLElement;
      
          // Ignore non-character keys unless Enter
          const isEnter = event.key === 'Enter';
          const isChar = event.key.length === 1;
          if (!isChar && !isEnter) return false;
      
          // Delay DOM measurement until after key press
          requestAnimationFrame(() => {
            const currentHeight = editorEl.scrollHeight;
      
            if (gridHeight && currentHeight > gridHeight) {
              // Undo the character or newline that caused overflow
              view.dispatch(
                view.state.tr.delete(
                  view.state.selection.from - 1,
                  view.state.selection.from
                )
              );
            }
          });
      
          return false;
        }
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
      // Calculate average character width (using a conservative estimate)
      const avgCharWidth = fontSize * 0.6; // Most characters are about 60% of font size width
      
      // Calculate characters per line, accounting for padding
      const padding = 32; // 1rem padding on each side
      const availableWidth = gridWidth - padding;
      const charsPerLine = Math.floor(availableWidth / avgCharWidth);
      
      // Calculate number of lines that can fit
      const lineHeight = fontSize * 1.25; // Standard line height
      const availableHeight = gridHeight - padding;
      const maxLines = Math.floor(availableHeight / lineHeight);
      
      // Calculate total characters, with some buffer for safety
      const maxChars = Math.floor(charsPerLine * maxLines * 0.9); // 90% of theoretical max for safety
      
      setMaxChars(maxChars);
    }
  }, [gridHeight, gridWidth, fontSize]);

  const handleConfirm = () => {
    if (editor) {
      // Save the current content when confirming
      setSavedContent(editor.getHTML());
    }
    if (onEditingChange) {
      onEditingChange(false);
      onMouseLeave?.();
    }
  };

  const handleCancel = () => {
    if (editor) {
      // Revert to saved content
      editor.commands.setContent(savedContent);
    }
    if (onEditingChange) {
      onEditingChange(false);
      onMouseLeave?.();
    }
  };

  // Reset to saved content when entering edit mode or when escape is pressed
  useEffect(() => {
    if (editor) {
      if (isEditing) {
        // When entering edit mode, show the saved content
        editor.commands.setContent(savedContent);
      } else {
        // When exiting edit mode (including via escape), revert to saved content
        editor.commands.setContent(savedContent);
      }
    }
  }, [isEditing, editor, savedContent]);

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
    <div 
      ref={editorRef}
      className="text-editor"
    >
      <EditorContent editor={editor} className="text-editor-tiptap" />
      {isEditing && (
        <>
          <TextToolbarPortal
            fontFamily={fontFamily}
            fontSize={fontSize}
            onFontFamilyChange={setFontFamily}
            onFontSizeChange={setFontSize}
            gridItemRef={editorRef}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
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
          {/* <div className={`char-count ${charCount > maxChars ? 'exceeded' : ''}`}>
            {charCount}/{maxChars}
          </div> */}
        </>
      )}
    </div>
  );
};

export default TextEditor;
