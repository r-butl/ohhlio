import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './TextToolbar.css';
import { useEditorStore, TextItemProps } from '../../events/EditorStore';

const TextToolbarPortal: React.FC<{ id: string }> = ({ id }) => {
  const item = useEditorStore(state => state.items[id]);
  const setItem = useEditorStore(state => state.setItems);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const confirmEdit = useEditorStore(state => state.confirmEdit);
  const cancelEdit = useEditorStore(state => state.cancelEdit);

  if (!item) return null;
  const { fontFamily, fontSize, textAlignHorizontal, textAlignVertical, isBold, isItalic, isUnderline } = item.props

    const [position, setPosition] = useState({ top: 0, left: 0 });
    const fontFamilies = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Courier New'];

    const updateProps = (props: Partial<TextItemProps>) => {
      setItem(draft => {
        if (draft[id]) {
          draft[id].props = { ...draft[id].props, ...props};
        }
      })
    }
  
    return createPortal(
      <div className="floating-toolbar" style={{ top: position.top, left: position.left, position: 'absolute' }}>
        <div className="toolbar-group">
          <label>Font</label>
          <select value={fontFamily} onChange={(e) => updateProps({ fontFamily: e.target.value })} className="font-family-select" >
            {fontFamilies.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-group">
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
            <button onClick={() => updateProps({ isBold: !isBold })} className={`format-button ${isBold ? 'active' : ''}`} title="Bold">
            <strong>B</strong>
            </button>
            <button onClick={() => updateProps({ isItalic: isItalic })} className={`format-button ${isItalic ? 'active' : ''}`} title="Italic">
              <em>I</em>
            </button>
            <button onClick={() => updateProps({ isItalic: !isItalic })} className={`format-button ${isUnderline ? 'active' : ''}`} title="Underline" >
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
            <button onClick={() => updateProps({textAlignHorizontal: 'center' })} className={`format-button ${textAlignHorizontal === 'center' ? 'active' : ''}`} title="Align Center">
              ⇔
            </button>
            <button onClick={() => updateProps({textAlignHorizontal: 'right' })} className={`format-button ${textAlignHorizontal === 'right' ? 'active' : ''}`} title="Align Right">
              ⇥
            </button>
          </div>
        </div>
        
        <div className="button-group">
          <label>Vertical Alignment</label>
          <div className='format-buttons'>
            <button onClick={() => updateProps({textAlignVertical: 'top' })} className={`format-button ${textAlignVertical === 'top' ? 'active' : ''}`} title="Align Top">
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
          <button onClick={() => confirmEdit(id) } className="confirm-button">✓</button>
          <button onClick={() => cancelEdit(id) } className="cancel-button">✕</button>
        </div>
      </div>,
      document.getElementById('portal-root') || document.body
    );
  };

export default TextToolbarPortal;