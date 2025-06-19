import React, { useEffect, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

import './TextEditor.css';
import TextToolbarPortal from '../options-panel/TextToolbar';
import { useEditorStore } from '../../events/EditorStore';

interface TextEditorProps {
  id: string;
  content: string;
  fontFamily: string;
  fontSize: number;
  textAlignHorizontal: string;
  textAlignVertical: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  maxChars: number;
  charCount: number;
  gridWidth: number;
  gridHeight: number;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  id, 
  content,
  fontFamily,
  fontSize,
  textAlignHorizontal,
  textAlignVertical,
  isBold,
  isItalic,
  isUnderline,
  maxChars,
  charCount,
  gridWidth,
  gridHeight, }) => {

  const isActiveEditor = useEditorStore(state => state.activeEditor === id);
  const isEditMode = useEditorStore(state => state.mode === 'edit');
  const isEditing = isActiveEditor && isEditMode;
  const setItems = useEditorStore(state => state.setItems);

  const DEFAULT_MESSAGE = "Select <strong>Options &gt; Edit</strong> to add text.";

  const editorRef = useRef<HTMLDivElement>(null!);
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'listItem', 'bulletList', 'orderedList'],
        defaultAlignment: textAlignHorizontal,
        alignments: ['left', 'center', 'right']
      }),
    ],
    content: DEFAULT_MESSAGE,
    editable: true,
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
      const html = editor.getHTML();
      const text = editor.getText();
      setItems(draft => {
        if (draft[id]) {
          draft[id].props.content = html;
          draft[id].props.charCount = text.length;
        }
      });
    }
  });


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
      const maxCharsCalc = Math.floor(charsPerLine * maxLines * 0.9); // 90% of theoretical max for safety
      
      setItems(draft => {
        if (draft[id]) {
          draft[id].props.maxChars = maxCharsCalc;
        }
      })
    }
  }, [gridHeight, gridWidth, fontSize, id, setItems]);

  useEffect(() => {
    if (editor) {      
      console.log('Setting editable state of editor.')
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);


  return (
    <div 
      ref={editorRef}
      className="text-editor"
    >
      <EditorContent editor={editor} className="text-editor-tiptap" />
      {isEditing && (
        <> <TextToolbarPortal id={id}/> </>
      )}
    </div>
  );
};

export default TextEditor;
