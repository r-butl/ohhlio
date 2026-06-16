import React, { useEffect } from 'react';
import './OptionsPanel.css';
import { useEditorStore } from '@/context/EditorStore';
import { TextProps } from '@/interfaces/ProjectItemsInterfaces';
import emitter from '@/global-state/EventBus';

const TextToolbar: React.FC<{ id: string }> = ({ id }) => {
  const item = useEditorStore(state => {
    for (const section of state.currentProject.items.sections) {
      const found = section.items.find(i => i.id === id);
      if (found) return found;
    }
    return null;
  });
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);

  useEffect(() => {
    setActiveEditor(id);
  }, []);

  if (!item || item.type !== 'text') return null;

  const { textAlignHorizontal, textStyle = 'paragraph' } = item.props;

  const updateProps = (props: Partial<TextProps>) => {
    setItemsWithHistory(draft => {
      for (const section of draft.sections) {
        const draftItem = section.items.find(i => i.id === id);
        if (draftItem && draftItem.type === 'text') {
          draftItem.props = { ...draftItem.props, ...props };
          return;
        }
      }
    });
  };

  const handleStyleChange = (style: 'heading' | 'paragraph') => {
    updateProps({ textStyle: style });
    if (style === 'heading') {
      emitter.emit('set:heading', { id, level: 2 });
    } else {
      emitter.emit('set:paragraph', { id });
    }
  };

  return (
    <>
      <div className="button-group">
        <label>Text Style</label>
        <div className="format-buttons">
          <button
            onClick={() => handleStyleChange('heading')}
            className={`format-button ${textStyle === 'heading' ? 'active' : ''}`}
            title="Heading"
          >
            H
          </button>
          <button
            onClick={() => handleStyleChange('paragraph')}
            className={`format-button ${textStyle === 'paragraph' ? 'active' : ''}`}
            title="Paragraph"
          >
            P
          </button>
        </div>
      </div>

      <div className="button-group">
        <label>Alignment</label>
        <div className="format-buttons">
          <button
            onClick={() => updateProps({ textAlignHorizontal: 'left' })}
            className={`format-button ${textAlignHorizontal === 'left' ? 'active' : ''}`}
            title="Align Left"
          >
            ⇤
          </button>
          <button
            onClick={() => updateProps({ textAlignHorizontal: 'center' })}
            className={`format-button ${textAlignHorizontal === 'center' ? 'active' : ''}`}
            title="Align Center"
          >
            ⇔
          </button>
          <button
            onClick={() => updateProps({ textAlignHorizontal: 'right' })}
            className={`format-button ${textAlignHorizontal === 'right' ? 'active' : ''}`}
            title="Align Right"
          >
            ⇥
          </button>
        </div>
      </div>

    </>
  );
};

export default TextToolbar;
