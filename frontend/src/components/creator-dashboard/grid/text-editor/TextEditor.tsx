import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';


import { useEditorStore } from '@/context/EditorStore';
import emitter from '@/global-state/EventBus';
import { GridDimensions } from '../grid-item/GridItem';

interface TextEditorProps extends GridDimensions {
  id: string;
  content: string;
  fontFamily: string;
  fontSize: number;
  textAlignHorizontal: string;
  textAlignVertical: string;
  maxChars: number;
  charCount: number;
}

const TextEditor: React.FC<TextEditorProps> = ({
  id,
  gridWidth,
  gridHeight, }) => {

  const item = useEditorStore(state => {
    for (const section of state.currentProject.items.sections) {
      const found = section.items.find(i => i.id === id);
      if (found) return found;
    }
    return null;
  });
  const textProps = item?.type === 'text' ? item.props : undefined;
  const {
    content = '',
    fontFamily = 'Arial',
    fontSize = 16,
    textAlignHorizontal = 'left',
    textAlignVertical = 'center',
    maxChars = 1000,
  } = textProps ?? {};

  const isActiveEditor = useEditorStore(state => state.activeEditor === id);
  const isEditMode = useEditorStore(state => state.viewState === 'OwnerEdit');
  const isEditing = isActiveEditor && isEditMode;
  const DEFAULT_MESSAGE = "Select <strong>Options &gt; Edit</strong> to add text.";
  const [localContent, setLocalContent] = useState(() => {
    return content && content !== DEFAULT_MESSAGE ? content : DEFAULT_MESSAGE;
  });
  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);
  const setItemsWithoutHistory = useEditorStore(state => state.setItemsWithoutHistory);

  const editorRef = useRef<HTMLDivElement>(null!);
  const wasActiveEditorRef = useRef(false);

  // Update localContent when content changes from store (e.g., when entering edit mode)
  useEffect(() => {
    if (isEditing && content && content !== DEFAULT_MESSAGE) {
      setLocalContent(content);
    }
  }, [isEditing, content]);

  // Commit a single history entry when the toolbar closes
  useEffect(() => {
    if (isActiveEditor) {
      wasActiveEditorRef.current = true;
    } else if (wasActiveEditorRef.current) {
      wasActiveEditorRef.current = false;
      setItemsWithHistory(draft => {
        for (const section of draft.sections) {
          const draftItem = section.items.find(i => i.id === id);
          if (draftItem && draftItem.type === 'text') {
            draftItem.props.content = localContent;
            return;
          }
        }
      });
    }
  }, [isActiveEditor]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'listItem', 'bulletList', 'orderedList'],
        defaultAlignment: textAlignHorizontal,
        alignments: ['left', 'center', 'right']
      }),
      CharacterCount.configure({
        limit: maxChars || 1000,
      }),
    ],
    content: localContent,
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
      setLocalContent(html);
      setItemsWithoutHistory(draft => {
        for (const section of draft.sections) {
          const draftItem = section.items.find(i => i.id === id);
          if (draftItem && draftItem.type === 'text') {
            draftItem.props.content = html;
            return;
          }
        }
      });
    }
  });

  // Update editor content when localContent changes
  useEffect(() => {
    if (editor && editor.getHTML() !== localContent) {
      editor.commands.setContent(localContent);
    }
  }, [localContent, editor]);

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
      
      setItemsWithoutHistory(draft => {
        for (const section of draft.sections) {
          const draftItem = section.items.find(i => i.id === id);
          if (draftItem && draftItem.type === 'text') {
            draftItem.props.maxChars = maxCharsCalc;
            return;
          }
        }
      })
    }
  }, [gridHeight, gridWidth, fontSize, id, setItemsWithoutHistory]);


  // Handles bold, italic, and underline commands to the editor
  useEffect(() => {

    if (!editor) return;

    const handleSetHeading = ({ id: targetId, level }: { id: string; level: 1 | 2 | 3 | 4 | 5 | 6 }) => {
      if (targetId === id) {
        editor.chain().focus().toggleHeading({ level }).run();
      }
    };

    const handleSetParagraph = ({ id: targetId }: { id: string }) => {
      if (targetId === id) {
        editor.chain().focus().setParagraph().run();
      }
    };

    emitter.on('set:heading', handleSetHeading);
    emitter.on('set:paragraph', handleSetParagraph);

    return () => {
      emitter.off('set:heading', handleSetHeading);
      emitter.off('set:paragraph', handleSetParagraph);
    };

  }, [editor, id]);

  // Toggle the editor state
  useEffect(() => {
    if (editor) {      
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // Horizontal Alignment updates
  useEffect(() => {
    if (editor && textAlignHorizontal) {
      editor.commands.setTextAlign(textAlignHorizontal);
    }
  }, [editor, textAlignHorizontal]);

  // Vertical Alignment updates
  const getVerticalAlignStyle = (): React.CSSProperties => {
    switch (textAlignVertical) {
      case 'top':
        return { display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', height: '100%' };
      case 'center':
        return { display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' };
      case 'bottom':
        return { display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' };
      default:
        return { display: 'flex', flexDirection: 'column', height: '100%' };
    }
  };

  // Add a class for vertical alignment
  const verticalAlignClass = `vertical-align-${textAlignVertical}`;

  return (
    <div 
      ref={editorRef}
      className={`text-editor ${verticalAlignClass}`}
      style={getVerticalAlignStyle()}
    >
      <EditorContent editor={editor} className="text-editor-tiptap" />
    </div>
  );
};

export default TextEditor;
