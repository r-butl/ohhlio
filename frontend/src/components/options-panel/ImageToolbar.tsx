import React, { useEffect } from 'react';
import { useEditorStore } from '../../global-state/EditorStore';
import './OptionsPanel.css';
import ConfirmButton from '../buttons/Confirm';
import CancelButton from '../buttons/Cancel';


const ImageToolbar: React.FC<{ id: string }> = ({ id }) => {

  // tell the editor that an item is being edited
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  useEffect(() => {
    setActiveEditor(id);
  }, []);
  
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
