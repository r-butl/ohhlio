import { useState, useCallback } from 'react';

export const useButtonHover = (onButtonHoverChange?: (isHovered: boolean) => void) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onButtonHoverChange?.(true);
    console.log('Mouse entering');
  }, [onButtonHoverChange]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onButtonHoverChange?.(false);
    console.log('Mouse leaving');
  }, [onButtonHoverChange]);

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave
  };
}; 