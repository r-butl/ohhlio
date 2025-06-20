import React from 'react';
import emitter from '../../events/EventBus';
import { useEditorStore } from '../../events/EditorStore';
import './OptionsPanel.css';
import ConfirmButton from '../buttons/Confirm';
import CancelButton from '../buttons/Cancel';


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
        <ConfirmButton id={id} />
        <CancelButton/>
      </div>
    </>
  )
};

export default ImageToolbar;
