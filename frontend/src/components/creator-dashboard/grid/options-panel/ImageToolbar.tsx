import React, { useEffect } from 'react';
import { useEditorStore } from '@/context/EditorStore';
import './OptionsPanel.css';

const ImageToolbar: React.FC<{ id: string }> = ({ id }) => {
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);

  useEffect(() => {
    setActiveEditor(id);
  }, []);

  return null;
};

export default ImageToolbar;
