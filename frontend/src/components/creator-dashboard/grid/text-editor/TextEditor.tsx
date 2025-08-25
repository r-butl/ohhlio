import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';


import { useEditorStore } from '@/context/EditorStore';
import emitter from '@/global-state/EventBus';

interface TextEditorProps {
  id: string;
  content: string;
  fontFamily: string;
  fontSize: number;
  textAlignHorizontal: string;
  textAlignVertical: string;
  maxChars: number;
  charCount: number;
  gridWidth: number;
  gridHeight: number;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  id, 
  gridWidth,
  gridHeight, }) => {

  const item = useEditorStore(state => state.currentProject.items[id]);
  const {   
    content,
    fontFamily,
    fontSize,
    textAlignHorizontal,
    textAlignVertical,
    maxChars,
    charCount 
  } = item.props;

  const isActiveEditor = useEditorStore(state => state.activeEditor === id);
  const isEditMode = useEditorStore(state => state.mode === 'edit');
  const isEditing = isActiveEditor && isEditMode;
  const DEFAULT_MESSAGE = "Select <strong>Options &gt; Edit</strong> to add text.";
  const [localContent, setLocalContent] = useState(() => {
    return content && content !== DEFAULT_MESSAGE ? content : DEFAULT_MESSAGE;
  });
  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);
  const setItemsWithoutHistory = useEditorStore(state => state.setItemsWithoutHistory);

  const editorRef = useRef<HTMLDivElement>(null!);

  // Update localContent when content changes from store (e.g., when entering edit mode)
  useEffect(() => {
    if (isEditing && content && content !== DEFAULT_MESSAGE) {
      setLocalContent(content);
    }
  }, [isEditing, content]);

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
      setLocalContent(editor.getHTML());
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
        if (draft[id]) {
          draft[id].props.maxChars = maxCharsCalc;
        }
      })
    }
  }, [gridHeight, gridWidth, fontSize, id, setItemsWithoutHistory]);


  // Handles bold, italic, and underline commands to the editor
  useEffect(() => {

    if (!editor) return;

    const handleToggleBold = ( { id: targetId }: { id: string }) => {
      if (targetId === id) {
        editor.chain().focus().toggleBold().run();
      }
    };

    const handleToggleItalic = ( { id: targetId }: { id: string }) => {
      if (targetId === id) {
        editor.chain().focus().toggleItalic().run();
      }
    };

    const handleToggleUnderline = ( { id: targetId }: { id: string }) => {
      if (targetId === id) {
        editor.chain().focus().toggleUnderline().run();
      }
    };

    emitter.on("toggle:bold", handleToggleBold);
    emitter.on("toggle:italic", handleToggleItalic);
    emitter.on("toggle:underline", handleToggleUnderline);

    return () => {
      emitter.off("toggle:bold", handleToggleBold);
      emitter.off("toggle:italic", handleToggleItalic);
      emitter.off("toggle:underline", handleToggleUnderline);
    };

  }, [editor, id]);

  // Toggle the editor state
  useEffect(() => {
    if (editor) {      
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // Listen for the confirm or cancel signals
  useEffect(() => {

    const handleConfirm = ({id: editId} : {id: string}) => {
      if (editId === id && editor) {
        console.log('Confirm pressed - saving content:', localContent);
        setItemsWithHistory(draft => {
            if(draft[id]) {
              draft[id].props.content = localContent;
            }
          }
        )
      }
    }

    const handleCancel = () => {
      const resetContent = content || DEFAULT_MESSAGE;
      console.log('Cancel pressed - resetting to:', resetContent);
      setLocalContent(resetContent);
      if (editor) {
        editor.commands.setContent(resetContent);
      }
    }

    emitter.on('confirm-edit', handleConfirm);
    emitter.on('cancel-edit', handleCancel);

    return () => {
      emitter.off('confirm-edit', handleConfirm);
      emitter.off('cancel-edit', handleCancel);
    }
  }, [id, localContent, content, editor, setItemsWithHistory])

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
