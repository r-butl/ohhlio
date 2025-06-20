import { useState, useCallback } from 'react';
import { useEditorStore } from '../events/EditorStore';

export const useButtonHover = (onButtonHoverChange?: (isHovered: boolean) => void) => {
  const buttonHovered = useEditorStore(state => state.buttonHovered);
  const setButtonHoveredState = useEditorStore(state => state.setButtonHoveredState);

  const handleMouseEnter = useCallback(() => {
    setButtonHoveredState(true);
    onButtonHoverChange?.(true);
    console.log('Mouse entering');
  }, [onButtonHoverChange]);

  const handleMouseLeave = useCallback(() => {
    setButtonHoveredState(false);
    onButtonHoverChange?.(false);
    console.log('Mouse leaving');
  }, [onButtonHoverChange]);

  return {
    handleMouseEnter,
    handleMouseLeave
  };
}; 