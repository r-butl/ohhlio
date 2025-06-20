import React from 'react';
import emitter from '../../events/EventBus';
import { useEditorStore } from '../../events/EditorStore';
import './OptionsPanel.css';


const ImageToolbar: React.FC<{ id: string }> = ({ id }) => {

  const setActiveEditor = useEditorStore(state => state.setActiveEditor);

  const handleConfirm = () => {
    emitter.emit('confirm-edit', { id });
    setActiveEditor('null');
  }

  const handleCancel = () => {
    emitter.emit('cancel-edit');
    setActiveEditor('null');
  }
  return (
    <>
      <div className="toolbar-buttons">
        <button onClick={handleConfirm} className="confirm-button">✓</button>
        <button onClick={handleCancel} className="cancel-button">✕</button>
      </div>
    </>
  )
};

export default ImageToolbar;
