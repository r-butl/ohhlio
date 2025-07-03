import React, { useEffect, useRef, useState } from 'react';
import './OptionsPanel.css';
import { useEditorStore, TextItemProps } from '../../global-state/EditorStore';
import ConfirmButton from '../buttons/Confirm';
import CancelButton from '../buttons/Cancel';

import emitter from '../../global-state/EventBus';

const TextToolbar: React.FC<{ id: string }> = ({ id }) => {
  const item = useEditorStore(state => state.items[id]);
  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);

  if (!item) return null;
  const { fontFamily, fontSize, textAlignHorizontal, textAlignVertical } = item.props
  const fontFamilies = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Courier New'];

  // tell the editor that an item is being edited
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);

  
  useEffect(() => {
    setActiveEditor(id);
  }, []);

  const updateProps = (props: Partial<TextItemProps>) => {
    setItemsWithHistory(draft => {
      if (draft[id]) {
        draft[id].props = { ...draft[id].props, ...props};
      }
    })
  }

  return (
    <>
      <div className="drop-down">
        <label>Font</label>
        <select value={fontFamily} onChange={(e) => updateProps({ fontFamily: e.target.value })} className="font-family-select" >
          {fontFamilies.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>
      <div className="drop-down">
        <label>Size</label>
        <select value={fontSize} onChange={(e) => updateProps({ fontSize: Number(e.target.value) })} className="font-size-select" >
          {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </div>
      
      <div className="button-group">
        <label>Text Formatting</label>
        <div className='format-buttons'>
          <button onClick={() => emitter.emit('toggle:bold', { id })} className={`format-button`} title="Bold">
          <strong>B</strong>
          </button>
          <button onClick={() => emitter.emit('toggle:italic', { id })} className={`format-button`} title="Italic">
            <em>I</em>
          </button>
          <button onClick={() => emitter.emit('toggle:underline', { id })} className={`format-button`} title="Underline" >
            <u>U</u>
          </button>
        </div>
      </div>

      <div className="button-group ">
        <label>Alignment</label>
        <div className='format-buttons'>
          <button onClick={() => updateProps({ textAlignHorizontal: 'left' })} className={`format-button ${textAlignHorizontal === 'left' ? 'active' : ''}`} title="Align Left">
            ⇤
          </button>
          <button onClick={() => updateProps({ textAlignHorizontal: 'center' })} className={`format-button ${textAlignHorizontal === 'center' ? 'active' : ''}`} title="Align Center">
            ⇔
          </button>
          <button onClick={() => updateProps({ textAlignHorizontal: 'right' })} className={`format-button ${textAlignHorizontal === 'right' ? 'active' : ''}`} title="Align Right">
            ⇥
          </button>
        </div>
      </div>
      
      <div className="button-group">
        <label>Vertical Alignment</label>
        <div className='format-buttons'>
          <button onClick={() => updateProps({ textAlignVertical: 'top' })} className={`format-button ${textAlignVertical === 'top' ? 'active' : ''}`} title="Align Top">
            ⇧
          </button>
          <button onClick={() => updateProps({ textAlignVertical: 'center' })} className={`format-button ${textAlignVertical === 'middle' ? 'active' : ''}`} title="Align Middle">
            ⇔
          </button>
          <button onClick={() => updateProps({ textAlignVertical: 'bottom' })} className={`format-button ${textAlignVertical === 'bottom' ? 'active' : ''}`} title="Align Bottom">
            ⇩
          </button>
        </div>
      </div>
      
      <div className="toolbar-group">
        <ConfirmButton id={id} />
        <CancelButton/>
      </div>
    </>
    );
};

export default TextToolbar;