import React, { useEffect } from 'react';
import './OptionsPanel.css';
import { useEditorStore } from '@/context/EditorStore';
import { TextProps } from '@/interfaces/ProjectItemsInterfaces';
import ConfirmButton from '@/components/buttons/Confirm';
import CancelButton from '@/components/buttons/Cancel';
import emitter from '@/global-state/EventBus';

const TextToolbar: React.FC<{ id: string }> = ({ id }) => {
  const item = useEditorStore(state => state.currentProject.items[id]);
  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);

  useEffect(() => {
    setActiveEditor(id);
  }, []);

  if (!item || item.type !== 'text') return null;

  const { textAlignHorizontal, textStyle = 'paragraph' } = item.props;
  const currentWidth = item.layout.w;

  const updateProps = (props: Partial<TextProps>) => {
    setItemsWithHistory(draft => {
      const draftItem = draft[id];
      if (draftItem && draftItem.type === 'text') {
        draftItem.props = { ...draftItem.props, ...props };
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

  const handleWidthChange = (w: number) => {
    setItemsWithHistory(draft => {
      if (draft[id]) {
        draft[id].layout.w = w;
        draft[id].layout.minW = w;
        draft[id].layout.maxW = w;
      }
    });
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

      <div className="button-group">
        <label>Width</label>
        <div className="format-buttons">
          <button
            onClick={() => handleWidthChange(2)}
            className={`format-button ${currentWidth === 2 ? 'active' : ''}`}
            title="Half width"
          >
            ½
          </button>
          <button
            onClick={() => handleWidthChange(4)}
            className={`format-button ${currentWidth === 4 ? 'active' : ''}`}
            title="Full width"
          >
            ⬜
          </button>
        </div>
      </div>

      <div className="toolbar-group">
        <ConfirmButton id={id} />
        <CancelButton />
      </div>
    </>
  );
};

export default TextToolbar;
